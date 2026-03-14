import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { InstantBooking } from './entities/instant-booking.entity';
import { ServiceListing } from '../listings/entities/service-listing.entity';
import { Provider } from '../users/entities/provider.entity';
import { CreateInstantBookingDto } from './dto/create-instant-booking.dto';
import { UserDeviceTokenService } from '../users/services/user-device-token.service';
import { AppMode } from '../users/entities/user-device-token.entity';
import { FcmService } from '../notifications/fcm.service';

@Injectable()
export class InstantBookingsService {
  private readonly logger = new Logger(InstantBookingsService.name);

  constructor(
    @InjectRepository(InstantBooking)
    private readonly instantBookingRepository: Repository<InstantBooking>,
    @InjectRepository(ServiceListing)
    private readonly serviceListingRepository: Repository<ServiceListing>,
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    private readonly userDeviceTokenService: UserDeviceTokenService,
    private readonly fcmService: FcmService,
  ) {}

  /**
   * ID로 instant_booking 한 건 조회. 없으면 404.
   */
  async findOne(id: string): Promise<InstantBooking> {
    const row = await this.instantBookingRepository.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Instant booking with id ${id} not found`);
    }
    return row;
  }

  /**
   * 앱 요청을 받아 instant_bookings 테이블에 새 행을 추가하고
   * booking_id, status, created_at 을 반환합니다.
   * 저장 후 해당 카테고리의 service_listings에 해당하는 provider들에게 FCM 푸시를 비동기로 발송합니다.
   */
  async create(dto: CreateInstantBookingDto): Promise<{
    booking_id: string;
    status: string;
    created_at: string;
  }> {
    const entity = this.instantBookingRepository.create({
      userId: dto.userId,
      serviceCategoryId: dto.serviceCategoryId,
      timeSlot: new Date(dto.timeSlot),
      location: dto.location,
      status: 'PENDING',
    });
    const saved = await this.instantBookingRepository.save(entity);

    // [Instant Booking → FCM] 해당 카테고리의 service_listings provider 찾아 푸시 발송 (비동기, 실패해도 201 반환)
    this.notifyProvidersForNewInstantBooking(saved).catch((err) => {
      this.logger.error(`[InstantBooking Push] Failed bookingId=${saved.id}`, err?.stack || err?.message || err);
    });
    this.logger.log(`[InstantBooking] created bookingId=${saved.id} categoryId=${dto.serviceCategoryId} - provider FCM triggered`);

    return {
      booking_id: saved.id,
      status: saved.status,
      created_at: saved.createdAt.toISOString(),
    };
  }

  /**
   * 요청된 category_id 기준으로 service_listings를 필터링 → provider_id 추출 → providers에서 user_id 조회
   * → user_device_tokens에서 provider 앱 토큰 조회 → FCM 푸시 발송 (location 포함).
   * 실패한 토큰(invalid/not-registered)은 비활성화하여 재전송 방지.
   */
  private async notifyProvidersForNewInstantBooking(booking: InstantBooking): Promise<void> {
    const bookingId = booking.id;
    const serviceCategoryId = booking.serviceCategoryId;
    const timeSlot = booking.timeSlot instanceof Date ? booking.timeSlot.toISOString() : String(booking.timeSlot);

    try {
      this.logger.log(`[InstantBooking Push] bookingId=${bookingId} categoryId=${serviceCategoryId} - step 1: finding listings...`);

      const listings = await this.serviceListingRepository.find({
        where: { categoryId: serviceCategoryId, isActive: true },
        select: ['providerId'],
      });
      const providerIds = [...new Set(listings.map((l) => l.providerId))];

      if (providerIds.length === 0) {
        this.logger.warn(`[InstantBooking Push] bookingId=${bookingId} - no service_listings for category ${serviceCategoryId}. No push sent.`);
        return;
      }
      this.logger.log(`[InstantBooking Push] bookingId=${bookingId} - step 1 done: listings=${listings.length} uniqueProviders=${providerIds.length}`);

      this.logger.log(`[InstantBooking Push] bookingId=${bookingId} - step 2: loading providers...`);
      const providers = await this.providerRepository.find({
        where: { id: In(providerIds) },
        select: ['id', 'userId'],
      });
      const userIds = providers.map((p) => p.userId).filter(Boolean);
      if (userIds.length === 0) {
        this.logger.warn(`[InstantBooking Push] bookingId=${bookingId} - no user_id for providerIds. No push sent.`);
        return;
      }
      this.logger.log(`[InstantBooking Push] bookingId=${bookingId} - step 2 done: userIds=${userIds.length} (${userIds.slice(0, 5).join(', ')}${userIds.length > 5 ? '...' : ''})`);

      this.logger.log(`[InstantBooking Push] bookingId=${bookingId} - step 3: loading provider FCM tokens...`);
      const allTokens: string[] = [];
      for (const userId of userIds) {
        const tokens = await this.userDeviceTokenService.getActiveTokens(userId, AppMode.PROVIDER);
        allTokens.push(...tokens);
      }
      const uniqueTokens = [...new Set(allTokens)].filter((t) => t && t.trim().length > 0);

      if (uniqueTokens.length === 0) {
        this.logger.warn(`[InstantBooking Push] bookingId=${bookingId} - no provider app device tokens (app_mode=provider). No push sent.`);
        return;
      }
      this.logger.log(`[InstantBooking Push] bookingId=${bookingId} - step 3 done: tokens=${uniqueTokens.length}`);

      this.logger.log(`[InstantBooking Push] bookingId=${bookingId} - step 4: sending FCM (with location)...`);
      const timeLabel = timeSlot ? new Date(timeSlot).toLocaleString() : '';
      const locationJson = booking.location ? JSON.stringify(booking.location) : '{}';
      const result = await this.fcmService.sendPushNotification(
        uniqueTokens,
        {
          title: 'New Instant Booking Request',
          body: timeLabel ? `New service request for ${timeLabel}. Open the app to respond.` : 'New instant booking request. Open the app to respond.',
          data: {
            type: 'instant_booking',
            booking_id: bookingId,
            service_category_id: serviceCategoryId,
            time_slot: timeSlot,
            location_json: locationJson,
          },
        },
      );

      if (result.errors?.length) {
        for (const { token, error } of result.errors) {
          const code = (error as { code?: string })?.code ?? (error as any)?.error?.code;
          if (
            code === 'messaging/invalid-registration-token' ||
            code === 'messaging/registration-token-not-registered'
          ) {
            try {
              await this.userDeviceTokenService.deactivateToken(token);
              this.logger.log(`[InstantBooking Push] deactivated invalid token: ${token?.slice(0, 24)}...`);
            } catch (e) {
              this.logger.warn(`[InstantBooking Push] failed to deactivate token: ${e}`);
            }
          }
        }
      }

      this.logger.log(`[InstantBooking Push] bookingId=${bookingId} - step 4 done: success=${result.success} failure=${result.failure}${result.errors?.length ? ` errors=${result.errors.length}` : ''}`);
    } catch (err) {
      this.logger.error(`[InstantBooking Push] bookingId=${bookingId} error`, err instanceof Error ? err.stack : String(err));
      throw err;
    }
  }

  /**
   * Provider가 대기열 항목 수락 시 호출.
   * item_id로 service_listings 조회, booking_id로 instant_booking 조회 후
   * ack_item_list에 ACCEPTED 항목을 추가합니다.
   */
  async acceptQueueItem(bookingId: string, providerId: string, itemId: string): Promise<{
    booking_id: string;
    ack_item_list: Array<{ itemid: string; provider_response: string; provider_response_at: string }>;
  }> {
    const listing = await this.serviceListingRepository.findOne({ where: { id: itemId } });
    if (!listing) {
      throw new NotFoundException(`Service listing with id ${itemId} not found`);
    }
    if (listing.providerId !== providerId) {
      throw new BadRequestException('Provider does not own this listing');
    }

    const booking = await this.instantBookingRepository.findOne({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException(`Instant booking with id ${bookingId} not found`);
    }

    const newEntry = {
      itemid: itemId,
      provider_response: 'ACCEPTED' as const,
      provider_response_at: new Date().toISOString(),
    };
    const currentList = Array.isArray(booking.ackItemList) ? [...booking.ackItemList] : [];
    const alreadyAdded = currentList.some((e) => e.itemid === itemId);
    if (alreadyAdded) {
      throw new BadRequestException('This item has already been accepted for this booking');
    }
    currentList.push(newEntry);
    booking.ackItemList = currentList;
    await this.instantBookingRepository.save(booking);

    return {
      booking_id: booking.id,
      ack_item_list: booking.ackItemList,
    };
  }
}
