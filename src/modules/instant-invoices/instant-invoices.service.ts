import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstantInvoice } from './entities/instant-invoice.entity';
import { Provider } from '../users/entities/provider.entity';
import { CreateInstantInvoiceDto } from './dto/create-instant-invoice.dto';
import { ListingsService } from '../listings/listings.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class InstantInvoicesService {
  constructor(
    @InjectRepository(InstantInvoice)
    private readonly instantInvoiceRepository: Repository<InstantInvoice>,
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    private readonly listingsService: ListingsService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Order Now에서 프로바이더 선택 후 Order 시 인보이스 한 건 생성.
   * consumer_id는 JWT에서 채우거나 body로 받아 검증.
   */
  async create(dto: CreateInstantInvoiceDto, consumerIdFromJwt: string): Promise<{
    id: string;
    total_amount: number;
    payment_status: string;
    booking_status: string;
    created_at: Date;
    listing_name?: string;
    consumer_name?: string;
    provider_name?: string;
    service_address_option?: string;
  }> {
    const consumerId = dto.consumer_id ?? consumerIdFromJwt;
    if (consumerId !== consumerIdFromJwt) {
      throw new ForbiddenException('consumer_id must match the authenticated user');
    }

    const listing = await this.listingsService.findOne(dto.listing_id);
    const providerId =
      dto.provider_id ?? (listing as any)?.providerId ?? '';
    if (!providerId) {
      throw new BadRequestException('provider_id is required or listing must have a provider');
    }

    const listingName =
      dto.listing_name ?? (listing?.title ?? null) ?? null;
    let consumerName = dto.consumer_name ?? null;
    if (consumerName == null) {
      const user = await this.usersService.findOne(consumerId);
      consumerName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || null : null;
    }
    let providerName = dto.provider_name ?? null;
    if (providerName == null) {
      const provider = await this.providerRepository.findOne({
        where: { id: providerId },
        relations: ['user'],
      });
      if (provider) {
        const u = provider.user;
        const userDisplayName = u ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() : '';
        providerName =
          (provider.businessName && provider.businessName.trim()) || userDisplayName || null;
      }
    }

    // 앱의 provider_id = providers.id (UUID) 그대로 매핑
    const entity = this.instantInvoiceRepository.create({
      listingId: dto.listing_id,
      consumerId,
      providerId: String(providerId),
      listingName: listingName || null,
      consumerName: consumerName || null,
      providerName: providerName || null,
      instantBookingId: dto.instant_booking_id,
      serviceDate: dto.service_date,
      serviceTime: dto.service_time,
      serviceAddress: dto.service_address,
      serviceAddressOption: dto.service_address_option ?? null,
      serviceLat: dto.service_lat != null ? String(dto.service_lat) : null,
      serviceLng: dto.service_lng != null ? String(dto.service_lng) : null,
      priceType: dto.price_type,
      variantId: dto.variant_id ?? null,
      addonItemIds: dto.addon_item_ids ?? null,
      extraPersonCount: dto.extra_person_count ?? 0,
      basePrice: String(dto.base_price),
      addonsTotal: String(dto.addons_total ?? 0),
      personFee: String(dto.person_fee ?? 0),
      travelFee: String(dto.travel_fee ?? 0),
      finalPrice: String(dto.final_price),
      serviceAmount: String(dto.service_amount),
      platformFee: String(dto.platform_fee),
      vatableAmount: dto.vatable_amount != null ? String(dto.vatable_amount) : null,
      vatAmount: dto.vat_amount != null ? String(dto.vat_amount) : null,
      totalAmount: String(dto.total_amount),
      consumerNotes: dto.consumer_notes ?? null,
      bookingStatus: 'confirmed',
      paymentStatus: 'pending',
      settlementStatus: 'pending',
    });

    const saved = await this.instantInvoiceRepository.save(entity);
    const totalAmount = Number(saved.totalAmount);

    return {
      id: saved.id,
      total_amount: totalAmount,
      payment_status: saved.paymentStatus,
      booking_status: saved.bookingStatus,
      created_at: saved.createdAt,
      listing_name: saved.listingName ?? undefined,
      consumer_name: saved.consumerName ?? undefined,
      provider_name: saved.providerName ?? undefined,
      service_address_option: saved.serviceAddressOption ?? undefined,
    };
  }

  async findOne(id: string): Promise<InstantInvoice | null> {
    return this.instantInvoiceRepository.findOne({ where: { id } });
  }

  /** instant_booking_id로 인보이스 1건 조회 (결제 초기화 등에서 사용) */
  async findOneByInstantBookingId(instantBookingId: string): Promise<InstantInvoice | null> {
    return this.instantInvoiceRepository.findOne({ where: { instantBookingId } });
  }

  /**
   * user_type에 따라 consumer_id 또는 provider_id로 인보이스 목록 조회. 최신순.
   * @param userId JWT user id
   * @param userType 'consumer' → consumer_id = userId, 'provider' → provider_id = (해당 user의 providers.id)
   */
  async findAllByUserAndType(
    userId: string,
    userType: 'consumer' | 'provider',
  ): Promise<InstantInvoice[]> {
    if (userType === 'consumer') {
      return this.instantInvoiceRepository.find({
        where: { consumerId: userId },
        order: { createdAt: 'DESC' },
      });
    }
    const provider = await this.providerRepository.findOne({
      where: { userId },
      select: ['id'],
    });
    if (!provider) {
      return [];
    }
    return this.instantInvoiceRepository.find({
      where: { providerId: provider.id },
      order: { createdAt: 'DESC' },
    });
  }
}
