import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ServiceListing } from './entities/service-listing.entity';
import { ServiceVariant } from './entities/service-variant.entity';
import { ServiceAddonGroup } from './entities/service-addon-group.entity';
import { ServiceAddonItem } from './entities/service-addon-item.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { QueryListingsDto } from './dto/query-listings.dto';
import { CreateVariantsDto } from './dto/create-variants.dto';
import { CreateAddonGroupsDto } from './dto/create-addon-groups.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { UpdateAddonGroupDto } from './dto/update-addon-group.dto';
import { UsersService } from '../users/users.service';
import { BookingStatus } from '../bookings/entities/booking.entity';
import { InstantServiceList } from '../instant-service-list/entities/instant-service-list.entity';

export interface ListingDetailResponse {
  id: string;
  title: string;
  description?: string | null;
  pricingType: string;
  fixedPrice: number | null;
  variants: Array<{ id: string; name: string; price: number; durationMinutes: number; isDefault: boolean }>;
  addonGroups: Array<{
    id: string;
    name: string;
    isRequired: boolean;
    isMultiple: boolean;
    items: Array<{ id: string; label: string; extraPrice: number }>;
  }>;
  pricingRules: Record<string, unknown> | null;
  [key: string]: unknown;
}

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(ServiceListing)
    private readonly listingRepository: Repository<ServiceListing>,
    @InjectRepository(ServiceVariant)
    private readonly variantRepository: Repository<ServiceVariant>,
    @InjectRepository(ServiceAddonGroup)
    private readonly addonGroupRepository: Repository<ServiceAddonGroup>,
    @InjectRepository(ServiceAddonItem)
    private readonly addonItemRepository: Repository<ServiceAddonItem>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(InstantServiceList)
    private readonly instantServiceListRepository: Repository<InstantServiceList>,
    private readonly usersService: UsersService,
  ) {}

  async create(userId: string, dto: CreateListingDto): Promise<ServiceListing> {
    const provider = await this.usersService.getProviderByUserId(userId);
    if (!provider) {
      throw new ForbiddenException('Provider profile not found for this user');
    }
    const pricingType = (dto.pricingType ?? 'FIXED').toUpperCase();
    const listing = this.listingRepository.create({
      providerId: provider.id,
      categoryId: dto.categoryId,
      title: dto.title,
      description: dto.description ?? null,
      pricingType,
      pricingRules: dto.pricingRules ?? null,
      fixedPrice: pricingType === 'VARIANT' ? null : dto.fixedPrice != null ? String(dto.fixedPrice) : null,
      durationMinutes: dto.durationMinutes,
      serviceAreas: dto.serviceAreas ?? null,
      advanceNoticeHours: dto.advanceNoticeHours ?? 1,
      isInstantBook: dto.isInstantBook ?? true,
      isActive: dto.isActive ?? true,
      photos: dto.photos ?? null,
    });
    return this.listingRepository.save(listing);
  }

  async findAll(query: QueryListingsDto): Promise<{
    items: ServiceListing[];
    total: number;
    page: number;
    limit: number;
  }> {
    const qb = this.listingRepository
      .createQueryBuilder('listing')
      .where('listing.is_active = :isActive', { isActive: true });

    if (query.category_id) {
      qb.andWhere('listing.category_id = :categoryId', { categoryId: query.category_id });
    }
    if (query.area) {
      qb.andWhere('listing.service_areas::text ILIKE :areaPattern', {
        areaPattern: `%${query.area}%`,
      });
    }
    if (query.min_price != null) {
      qb.andWhere('listing.fixed_price >= :minPrice', { minPrice: query.min_price });
    }
    if (query.max_price != null) {
      qb.andWhere('listing.fixed_price <= :maxPrice', { maxPrice: query.max_price });
    }
    if (query.is_instant_book !== undefined) {
      qb.andWhere('listing.is_instant_book = :isInstantBook', {
        isInstantBook: query.is_instant_book,
      });
    }

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    qb.orderBy('listing.created_at', 'DESC').skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  /**
   * JWT userId → providers에서 provider_id 조회 후, 해당 provider의 service_listings 조회.
   * pricing_type 이 VARIANT 이면 service_variants 에서 해당 id 로 조회해 variants 추가.
   * pricing_addon 이 true 이면 service_addon_groups / service_addon_items 에서 해당 listing id 로 조회해 addonGroups 추가.
   * pricingRules 도 각 항목에 포함.
   */
  async getMyListings(userId: string): Promise<{ items: any[]; total: number }> {
    const provider = await this.usersService.getProviderByUserId(userId);
    if (!provider) {
      return { items: [], total: 0 };
    }
    const [listings, total] = await this.listingRepository.findAndCount({
      where: { providerId: provider.id },
      order: { createdAt: 'DESC' },
    });

    const items = await Promise.all(
      listings.map(async (listing) => {
        let variants: ServiceVariant[] = [];
        let addonGroups: Array<{
          id: string;
          name: string;
          isRequired: boolean;
          isMultiple: boolean;
          items: Array<{ id: string; label: string; extraPrice: number }>;
        }> = [];

        if (String(listing.pricingType).toUpperCase() === 'VARIANT') {
          variants = await this.variantRepository.find({
            where: { serviceId: listing.id },
            order: { sortOrder: 'ASC' },
          });
        }

        const pricingAddon =
          listing.pricingAddon === true ||
          (listing as any).pricing_addon === true ||
          String((listing as any).pricing_addon) === 'true';
        if (pricingAddon) {
          const groups = await this.addonGroupRepository
            .createQueryBuilder('g')
            .where('g.service_id = :serviceId', { serviceId: listing.id })
            .orderBy('g.sort_order', 'ASC')
            .getMany();
          const groupIds = groups.map((g) => g.id);
          const allItems: ServiceAddonItem[] =
            groupIds.length > 0
              ? await this.addonItemRepository
                  .createQueryBuilder('i')
                  .where('i.group_id IN (:...groupIds)', { groupIds })
                  .orderBy('i.sort_order', 'ASC')
                  .getMany()
              : [];
          const itemsByGroup = new Map<string, ServiceAddonItem[]>();
          for (const item of allItems) {
            const list = itemsByGroup.get(item.groupId) ?? [];
            list.push(item);
            itemsByGroup.set(item.groupId, list);
          }
          addonGroups = groups.map((g) => ({
            id: g.id,
            name: g.name,
            isRequired: g.isRequired ?? false,
            isMultiple: g.isMultiple ?? false,
            items: (itemsByGroup.get(g.id) ?? []).map((i) => ({
              id: i.id,
              label: i.label,
              extraPrice: parseFloat(String(i.extraPrice)),
            })),
          }));
        }

        // 엔티티 스프레드 대신 평문 객체로 구성해 addonGroups/variants가 직렬화에서 누락되지 않도록 함
        const row = listing as unknown as Record<string, unknown>;
        const item: Record<string, unknown> = {
          id: row.id,
          providerId: row.providerId,
          categoryId: row.categoryId,
          title: row.title,
          description: row.description,
          pricingType: row.pricingType,
          fixedPrice: row.fixedPrice,
          pricingRules: listing.pricingRules ?? null,
          pricingAddon: row.pricingAddon ?? row.pricing_addon ?? false,
          durationMinutes: row.durationMinutes,
          serviceAreas: row.serviceAreas,
          advanceNoticeHours: row.advanceNoticeHours,
          isInstantBook: row.isInstantBook,
          isActive: row.isActive,
          photos: row.photos,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          variants,
          addonGroups,
        };
        return item;
      }),
    );

    return { items, total };
  }

  /**
   * serviceId 존재 여부를 service_listings 테이블에서 확인.
   * (POST /services/:serviceId/variants, addon-groups 에서 전달하는 serviceId = service_listings.id)
   */
  private async ensureServiceExists(serviceId: string): Promise<void> {
    const count = await this.listingRepository.count({ where: { id: serviceId } });
    if (count === 0) {
      throw new NotFoundException(`Service with ID ${serviceId} not found in service_listings`);
    }
  }

  /**
   * POST /api/v1/services/:serviceId/variants
   * JWT에서 userId 조회 → providers에서 providerId 조회. service_variants에 INSERT 후
   * service_listings.pricing_type 을 'VARIANT' 로 업데이트.
   */
  async createVariants(
    serviceId: string,
    userId: string,
    dto: CreateVariantsDto,
  ): Promise<{ created: number; variants: ServiceVariant[] }> {
    await this.usersService.getProviderByUserId(userId);
    await this.ensureServiceExists(serviceId);

    const created: ServiceVariant[] = [];
    for (const v of dto.variants) {
      const entity = this.variantRepository.create({
        serviceId,
        name: v.name,
        description: v.description ?? null,
        price: String(v.price),
        durationMinutes: v.durationMinutes,
        sortOrder: v.sortOrder ?? 0,
        isDefault: v.isDefault ?? false,
        isActive: true,
      });
      created.push(await this.variantRepository.save(entity));
    }

    await this.listingRepository.update(
      { id: serviceId },
      { pricingType: 'VARIANT' },
    );

    return { created: created.length, variants: created };
  }

  /**
   * Addon Groups + Items 한 번에 등록. service_addon_groups, service_addon_items 테이블에 INSERT.
   * JWT userId → provider 조회, listing 존재 확인 후 INSERT.
   */
  async createAddonGroups(
    serviceId: string,
    userId: string,
    dto: CreateAddonGroupsDto,
  ): Promise<{
    createdGroups: number;
    createdItems: number;
    groups: ServiceAddonGroup[];
  }> {
    await this.usersService.getProviderByUserId(userId);
    await this.ensureServiceExists(serviceId);
    const groups: ServiceAddonGroup[] = [];
    let totalItems = 0;
    for (const g of dto.addonGroups) {
      const groupEntity = this.addonGroupRepository.create({
        serviceId,
        name: g.name,
        isRequired: g.isRequired ?? false,
        isMultiple: g.isMultiple ?? false,
        sortOrder: g.sortOrder ?? 0,
      });
      const savedGroup = await this.addonGroupRepository.save(groupEntity);
      groups.push(savedGroup);
      for (const it of g.items) {
        const itemEntity = this.addonItemRepository.create({
          groupId: savedGroup.id,
          label: it.label,
          extraPrice: String(it.extraPrice),
          sortOrder: it.sortOrder ?? 0,
          isActive: true,
        });
        await this.addonItemRepository.save(itemEntity);
        totalItems += 1;
      }
    }

    await this.listingRepository.update(
      { id: serviceId },
      { pricingAddon: true },
    );

    return { createdGroups: groups.length, createdItems: totalItems, groups };
  }

  /**
   * DELETE /services/:serviceId/variants/:variantId - Variant 1건 삭제.
   */
  async removeVariant(serviceId: string, variantId: string, userId: string): Promise<{ message: string }> {
    await this.usersService.getProviderByUserId(userId);
    await this.ensureServiceExists(serviceId);
    const variant = await this.variantRepository.findOne({ where: { id: variantId, serviceId } });
    if (!variant) {
      throw new NotFoundException(`Variant with ID ${variantId} not found for this service`);
    }
    await this.variantRepository.remove(variant);
    return { message: 'Variant deleted' };
  }

  /**
   * PATCH /services/:serviceId/variants/:variantId - Variant 변경.
   */
  async updateVariant(
    serviceId: string,
    variantId: string,
    userId: string,
    dto: UpdateVariantDto,
  ): Promise<ServiceVariant> {
    await this.usersService.getProviderByUserId(userId);
    await this.ensureServiceExists(serviceId);
    const variant = await this.variantRepository.findOne({ where: { id: variantId, serviceId } });
    if (!variant) {
      throw new NotFoundException(`Variant with ID ${variantId} not found for this service`);
    }
    if (dto.name !== undefined) variant.name = dto.name;
    if (dto.description !== undefined) variant.description = dto.description;
    if (dto.price !== undefined) variant.price = String(dto.price);
    if (dto.durationMinutes !== undefined) variant.durationMinutes = dto.durationMinutes;
    if (dto.sortOrder !== undefined) variant.sortOrder = dto.sortOrder;
    if (dto.isDefault !== undefined) variant.isDefault = dto.isDefault;
    return this.variantRepository.save(variant);
  }

  /**
   * DELETE /services/:serviceId/addon-groups/:groupId - 그룹 + 하위 아이템 전체 삭제.
   */
  async removeAddonGroup(serviceId: string, groupId: string, userId: string): Promise<{ message: string }> {
    await this.usersService.getProviderByUserId(userId);
    await this.ensureServiceExists(serviceId);
    const group = await this.addonGroupRepository.findOne({ where: { id: groupId, serviceId } });
    if (!group) {
      throw new NotFoundException(`Addon group with ID ${groupId} not found for this service`);
    }
    await this.addonItemRepository.delete({ groupId });
    await this.addonGroupRepository.remove(group);
    return { message: 'Addon group and items deleted' };
  }

  /**
   * PATCH /services/:serviceId/addon-groups/:groupId - 그룹 + 하위 아이템 변경.
   * items 전달 시 기존 아이템 삭제 후 새 목록으로 교체.
   */
  async updateAddonGroup(
    serviceId: string,
    groupId: string,
    userId: string,
    dto: UpdateAddonGroupDto,
  ): Promise<ServiceAddonGroup> {
    await this.usersService.getProviderByUserId(userId);
    await this.ensureServiceExists(serviceId);
    const group = await this.addonGroupRepository.findOne({ where: { id: groupId, serviceId } });
    if (!group) {
      throw new NotFoundException(`Addon group with ID ${groupId} not found for this service`);
    }
    if (dto.name !== undefined) group.name = dto.name;
    if (dto.isRequired !== undefined) group.isRequired = dto.isRequired;
    if (dto.isMultiple !== undefined) group.isMultiple = dto.isMultiple;
    if (dto.sortOrder !== undefined) group.sortOrder = dto.sortOrder;
    await this.addonGroupRepository.save(group);

    if (dto.items && Array.isArray(dto.items)) {
      await this.addonItemRepository.delete({ groupId });
      for (let i = 0; i < dto.items.length; i++) {
        const it = dto.items[i];
        const item = this.addonItemRepository.create({
          groupId: group.id,
          label: it.label,
          extraPrice: String(it.extraPrice),
          sortOrder: it.sortOrder ?? i,
          isActive: true,
        });
        await this.addonItemRepository.save(item);
      }
    }

    const updated = await this.addonGroupRepository.findOne({
      where: { id: groupId },
      relations: ['items'],
    });
    if (!updated) throw new NotFoundException(`Addon group ${groupId} not found`);
    return updated;
  }

  async findOne(id: string): Promise<ListingDetailResponse> {
    const listing = await this.listingRepository.findOne({ where: { id } });
    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }

    const variants = await this.variantRepository.find({
      where: { serviceId: id, isActive: true },
      order: { sortOrder: 'ASC' },
    });

    const rawPricingType = (listing.pricingType ?? '').toString().trim().toUpperCase();
    const hasVariants = variants.length > 0;
    const pricingType =
      rawPricingType === 'VARIANT' || rawPricingType === 'ADDON'
        ? rawPricingType
        : hasVariants
          ? 'VARIANT'
          : 'FIXED';
    const fixedPrice =
      pricingType === 'VARIANT' || pricingType === 'ADDON' || hasVariants
        ? null
        : listing.fixedPrice != null
          ? parseFloat(String(listing.fixedPrice))
          : null;
    const addonGroups = await this.addonGroupRepository.find({
      where: { serviceId: id },
      order: { sortOrder: 'ASC' },
    });
    const groupIds = addonGroups.map((g) => g.id);
    const allItems =
      groupIds.length > 0
        ? await this.addonItemRepository
            .createQueryBuilder('item')
            .where('item.group_id IN (:...ids)', { ids: groupIds })
            .andWhere('item.is_active = :active', { active: true })
            .orderBy('item.sort_order', 'ASC')
            .getMany()
        : [];
    const itemsByGroup = new Map<string, ServiceAddonItem[]>();
    for (const item of allItems) {
      const list = itemsByGroup.get(item.groupId) ?? [];
      list.push(item);
      itemsByGroup.set(item.groupId, list);
    }

    const base: ListingDetailResponse = {
      id: listing.id,
      title: listing.title,
      description: listing.description ?? undefined,
      pricingType,
      fixedPrice,
      variants: variants.map((v) => ({
        id: v.id,
        name: v.name,
        price: parseFloat(String(v.price)),
        durationMinutes: v.durationMinutes,
        isDefault: v.isDefault ?? false,
      })),
      addonGroups: addonGroups.map((g) => ({
        id: g.id,
        name: g.name,
        isRequired: g.isRequired ?? false,
        isMultiple: g.isMultiple ?? false,
        items: (itemsByGroup.get(g.id) ?? []).map((i) => ({
          id: i.id,
          label: i.label,
          extraPrice: parseFloat(String(i.extraPrice)),
        })),
      })),
      pricingRules: listing.pricingRules ?? null,
    };

    Object.assign(base, {
      providerId: listing.providerId,
      categoryId: listing.categoryId,
      durationMinutes: listing.durationMinutes,
      serviceAreas: listing.serviceAreas,
      advanceNoticeHours: listing.advanceNoticeHours,
      isInstantBook: listing.isInstantBook,
      isActive: listing.isActive,
      photos: listing.photos,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    });
    return base;
  }

  async update(id: string, userId: string, dto: UpdateListingDto): Promise<ServiceListing> {
    const listing = await this.listingRepository.findOne({ where: { id }, relations: ['provider'] });
    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }
    const provider = await this.usersService.getProviderByUserId(userId);
    if (!provider || provider.id !== listing.providerId) {
      throw new ForbiddenException('You can only update your own listings');
    }
    const updatePayload = { ...dto };
    if (typeof (updatePayload as any).fixedPrice === 'number') {
      (listing as any).fixedPrice = String((updatePayload as any).fixedPrice);
      delete (updatePayload as any).fixedPrice;
    }
    Object.assign(listing, updatePayload);
    return this.listingRepository.save(listing);
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const listing = await this.listingRepository.findOne({ where: { id } });
    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }
    const provider = await this.usersService.getProviderByUserId(userId);
    if (!provider || provider.id !== listing.providerId) {
      throw new ForbiddenException('You can only delete your own listings');
    }
    listing.isActive = false;
    await this.listingRepository.save(listing);
    return { message: 'Listing deactivated successfully' };
  }

  async getAvailability(id: string): Promise<{ availableSlots: { date: string; slots: string[] }[] }> {
    const listing = await this.listingRepository.findOne({
      where: { id },
      relations: ['provider'],
    });
    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }
    const provider = listing.provider as any;
    const durationMinutes = listing.durationMinutes ?? 60;
    const advanceNoticeHours = listing.advanceNoticeHours ?? 1;

    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    const statusesToExclude = [
      BookingStatus.CANCELLED,
      BookingStatus.DISPUTED,
      BookingStatus.PENDING_PAYMENT,
      BookingStatus.PENDING_ACCEPTANCE,
      BookingStatus.AWAITING_CONFIRMATION,
    ];
    const bookings = await this.bookingRepository
      .createQueryBuilder('b')
      .where('b.provider_id = :providerId', { providerId: listing.providerId })
      .andWhere('b.scheduled_date >= :start', { start: startDate })
      .andWhere('b.scheduled_date < :end', { end: endDate })
      .andWhere('b.status NOT IN (:...statuses)', { statuses: statusesToExclude })
      .getMany();

    const availableDays = provider?.availableDays ?? [1, 2, 3, 4, 5];
    const startTime = provider?.availableHoursStart ?? '09:00';
    const endTime = provider?.availableHoursEnd ?? '18:00';

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const slotInterval = durationMinutes;
    const result: { date: string; slots: string[] }[] = [];
    const noticeCutoff = new Date(now);
    noticeCutoff.setHours(noticeCutoff.getHours() + advanceNoticeHours);

    for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay();
      if (!availableDays.includes(dayOfWeek)) continue;

      const dateStr = d.toISOString().slice(0, 10);
      const slots: string[] = [];
      const isToday = dateStr === now.toISOString().slice(0, 10);

      for (let min = startMinutes; min + slotInterval <= endMinutes; min += slotInterval) {
        const slotStart = new Date(d);
        slotStart.setHours(0, 0, 0, 0);
        slotStart.setMinutes(min, 0, 0);
        if (isToday && slotStart < noticeCutoff) continue;

        const slotEnd = new Date(slotStart.getTime() + slotInterval * 60 * 1000);
        const overlaps = bookings.some((b) => {
          const bStart = new Date(b.scheduledDate).getTime();
          const bEnd = (b.scheduledEndDate ? new Date(b.scheduledEndDate).getTime() : bStart + (b.durationMinutes ?? 60) * 60 * 1000);
          return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart;
        });
        if (!overlaps) {
          slots.push(
            `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`,
          );
        }
      }
      if (slots.length) result.push({ date: dateStr, slots });
    }

    return { availableSlots: result };
  }
}
