import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { UsersService } from '../users/users.service';
import { UserDeviceTokenService } from '../users/services/user-device-token.service';
import { AppMode } from '../users/entities/user-device-token.entity';
import { FcmService } from './fcm.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly usersService: UsersService,
    private readonly userDeviceTokenService: UserDeviceTokenService,
    private readonly fcmService: FcmService,
  ) {}

  /**
   * 알림 타입에 따라 대상 앱 모드 결정
   */
  private getTargetAppModes(type: NotificationType): AppMode[] {
    // 알림 타입에 따라 consumer 또는 provider로 전송
    switch (type) {
      case NotificationType.AUCTION:
      case NotificationType.QUOTE:
      case NotificationType.RFQ:
        // 경매, 견적 관련은 주로 provider에게
        return [AppMode.PROVIDER];
      case NotificationType.BOOKING:
      case NotificationType.PAYMENT:
      case NotificationType.REVIEW:
        // 예약, 결제, 리뷰는 양쪽 모두
        return [AppMode.CONSUMER, AppMode.PROVIDER];
      case NotificationType.MESSAGE:
      case NotificationType.SYSTEM:
        // 메시지, 시스템 알림은 양쪽 모두
        return [AppMode.CONSUMER, AppMode.PROVIDER];
      default:
        return [AppMode.CONSUMER, AppMode.PROVIDER];
    }
  }

  async send(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<Notification> {
    // 1. 알림을 DB에 저장 (DB: user_id, type, title, message, related_id, related_type, action_url, ...)
    const notification = this.notificationRepository.create({
      userId,
      notificationType: type,
      title,
      message,
      actionUrl: metadata?.actionUrl ?? undefined,
      relatedEntityType: metadata?.relatedEntityType ?? undefined,
      relatedEntityId: metadata?.relatedEntityId ?? undefined,
    });

    const savedNotification = await this.notificationRepository.save(notification) as Notification;

    // 2. 사용자의 디바이스 토큰 조회 및 FCM 푸시 알림 전송
    try {
      // metadata에 targetAppMode가 지정되어 있으면 그것을 사용, 없으면 알림 타입에 따라 결정
      const targetAppModes: AppMode[] = metadata?.targetAppMode
        ? [metadata.targetAppMode as AppMode]
        : this.getTargetAppModes(type);

      // 각 앱 모드별로 토큰 조회 및 전송
      let totalSuccess = 0;
      const allErrors: any[] = [];

      for (const appMode of targetAppModes) {
        const deviceTokens = await this.userDeviceTokenService.getTokensByAppMode(
          userId,
          appMode,
        );

        if (deviceTokens.length > 0) {
          const pushResult = await this.fcmService.sendPushNotification(
            deviceTokens,
            {
              title,
              body: message,
              data: {
                notificationId: savedNotification.id,
                type: type,
                appMode: appMode,
                ...metadata,
              },
            },
          );

          totalSuccess += pushResult.success || 0;

          // 실패한 토큰 처리
          if (pushResult.errors && pushResult.errors.length > 0) {
            allErrors.push(...pushResult.errors);

            for (const error of pushResult.errors) {
              if (
                error.error?.code === 'messaging/invalid-registration-token' ||
                error.error?.code === 'messaging/registration-token-not-registered'
              ) {
                // 유효하지 않은 토큰 비활성화
                await this.userDeviceTokenService.deactivateToken(error.token);
              }
            }
          }
        }
      }

      // 3. 전송 결과 업데이트
      savedNotification.sentViaPush = totalSuccess > 0;
      await this.notificationRepository.save(savedNotification);
    } catch (error) {
      console.error('Failed to send push notification:', error);
      // 알림 저장은 성공했으므로 에러를 던지지 않음
    }

    return savedNotification;
  }

  /**
   * 전체 알림 목록 (관리자용). user_id 조건 없이 type, isRead, page, limit 만 적용.
   */
  async findAll(
    type?: NotificationType,
    isRead?: boolean,
    page: number = 1,
    limit: number = 20,
  ) {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .orderBy('notification.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (type !== undefined) {
      queryBuilder.andWhere('notification.notificationType = :type', { type });
    }

    if (isRead !== undefined) {
      queryBuilder.andWhere('notification.isRead = :isRead', { isRead });
    }

    const [items, total] = await queryBuilder.getManyAndCount();
    return { items, total };
  }

  async findByUser(
    userId: string,
    type?: NotificationType,
    isRead?: boolean,
    page: number = 1,
    limit: number = 20,
  ) {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (type !== undefined) {
      queryBuilder.andWhere('notification.notificationType = :type', { type });
    }

    if (isRead !== undefined) {
      queryBuilder.andWhere('notification.isRead = :isRead', { isRead });
    }

    const [items, total] = await queryBuilder.getManyAndCount();
    return { items, total };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (notification) {
      notification.isRead = true;
      notification.readAt = new Date();
      return this.notificationRepository.save(notification);
    }

    return notification;
  }
}
