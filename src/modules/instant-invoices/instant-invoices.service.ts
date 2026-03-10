import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstantInvoice } from './entities/instant-invoice.entity';
import { Provider } from '../users/entities/provider.entity';
import { CreateInstantInvoiceDto } from './dto/create-instant-invoice.dto';
import { ListingsService } from '../listings/listings.service';

@Injectable()
export class InstantInvoicesService {
  constructor(
    @InjectRepository(InstantInvoice)
    private readonly instantInvoiceRepository: Repository<InstantInvoice>,
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    private readonly listingsService: ListingsService,
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
  }> {
    const consumerId = dto.consumer_id ?? consumerIdFromJwt;
    if (consumerId !== consumerIdFromJwt) {
      throw new ForbiddenException('consumer_id must match the authenticated user');
    }

    const providerId =
      dto.provider_id ??
      (await this.listingsService.findOne(dto.listing_id).then((l) => l?.providerId ?? null)) ??
      '';
    if (!providerId) {
      throw new BadRequestException('provider_id is required or listing must have a provider');
    }

    // 앱의 provider_id = providers.id (UUID) 그대로 매핑
    const entity = this.instantInvoiceRepository.create({
      listingId: dto.listing_id,
      consumerId,
      providerId: String(providerId),
      instantBookingId: dto.instant_booking_id,
      serviceDate: dto.service_date,
      serviceTime: dto.service_time,
      serviceAddress: dto.service_address,
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
    };
  }

  async findOne(id: string): Promise<InstantInvoice | null> {
    return this.instantInvoiceRepository.findOne({ where: { id } });
  }

  /**
   * JWT user_id 기준: consumer_id = user_id 이거나, provider_id가 해당 user의 providers.id인 인보이스만 조회.
   * 최신순 정렬.
   */
  async findAllByUserId(userId: string): Promise<InstantInvoice[]> {
    const provider = await this.providerRepository.findOne({
      where: { userId },
      select: ['id'],
    });
    const providerId = provider?.id ?? null;

    const qb = this.instantInvoiceRepository
      .createQueryBuilder('inv')
      .where('inv.consumer_id = :userId', { userId });
    if (providerId) {
      qb.orWhere('inv.provider_id = :providerId', { providerId });
    }
    qb.orderBy('inv.created_at', 'DESC');

    return qb.getMany();
  }
}
