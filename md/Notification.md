Notification 시스템 구조
1. 아키텍처 개요
NestJS 모듈 기반이며, 데이터베이스 저장과 푸시 알림(FCM)을 지원합니다.

NotificationsModule
├── NotificationsService (핵심 비즈니스 로직)
├── FcmService (Firebase Cloud Messaging)
├── NotificationsController (REST API)
└── Notification Entity (데이터베이스 스키마)

2. 데이터베이스 구조
Notification 엔티티 (notifications 테이블)
notification.entity.ts
    @Entity('notifications')
    export class Notification {
      @PrimaryGeneratedColumn('uuid')
      id: string;
      @Column({ type: 'uuid' })
      userId: string;
      @ManyToOne(() => User)
      @JoinColumn({ name: 'userId' })
      user: User;
      @Column({
        type: 'enum',
        enum: NotificationType,
      })
      notificationType: NotificationType; // 알림 유형
      @Column()
      title: string; // 알림 제목
      @Column({ type: 'text' })
      message: string; // 알림 내용
      // 링크 정보
      @Column({ nullable: true })
      actionUrl: string; // 액션 URL
      @Column({ nullable: true })
      relatedEntityType: string; // 관련 엔티티 유형
      @Column({ type: 'uuid', nullable: true })
      relatedEntityId: string; // 관련 엔티티 ID
      // 우선순위
      @Column({
        type: 'enum',
        enum: NotificationPriority,
        default: NotificationPriority.NORMAL,
      })
      priority: NotificationPriority;

      // 상태
      @Column({ default: false })
      isRead: boolean; // 읽음 여부

      @Column({ type: 'timestamp', nullable: true })
      readAt: Date; // 읽은 시각

      // 전송 채널
      @Column({ default: false })
      sentViaPush: boolean; // 푸시 알림 전송 여부

      @Column({ default: false })
      sentViaEmail: boolean; // 이메일 전송 여부

      @Column({ default: false })
      sentViaSms: boolean; // SMS 전송 여부

      // 만료
      @Column({ type: 'timestamp', nullable: true })
      expiresAt: Date; // 만료 시각

      // 하위 호환성
      @Column({
        type: 'enum',
        enum: NotificationType,
        nullable: true,
      })
      type: NotificationType; // 하위 호환성 유지

      @Column({ type: 'jsonb', nullable: true })
      metadata: Record<string, any>; // 메타데이터

      @CreateDateColumn()
      createdAt: Date;
    }


Lines 29-105
@Entity('notifications')export class Notification {  @PrimaryGeneratedColumn('uuid')  id: string;  @Column({ type: 'uuid' })  userId: string;  @ManyToOne(() => User)  @JoinColumn({ name: 'userId' })  user: User;  @Column({    type: 'enum',    enum: NotificationType,  })  notificationType: NotificationType; // 알림 유형  @Column()  title: string; // 알림 제목  @Column({ type: 'text' })  message: string; // 알림 내용  // 링크 정보  @Column({ nullable: true })  actionUrl: string; // 액션 URL  @Column({ nullable: true })  relatedEntityType: string; // 관련 엔티티 유형  @Column({ type: 'uuid', nullable: true })  relatedEntityId: string; // 관련 엔티티 ID  // 우선순위  @Column({    type: 'enum',    enum: NotificationPriority,    default: NotificationPriority.NORMAL,  })  priority: NotificationPriority;  // 상태  @Column({ default: false })  isRead: boolean; // 읽음 여부  @Column({ type: 'timestamp', nullable: true })  readAt: Date; // 읽은 시각  // 전송 채널  @Column({ default: false })  sentViaPush: boolean; // 푸시 알림 전송 여부  @Column({ default: false })  sentViaEmail: boolean; // 이메일 전송 여부  @Column({ default: false })  sentViaSms: boolean; // SMS 전송 여부  // 만료  @Column({ type: 'timestamp', nullable: true })  expiresAt: Date; // 만료 시각  // 하위 호환성  @Column({    type: 'enum',    enum: NotificationType,    nullable: true,  })  type: NotificationType; // 하위 호환성 유지  @Column({ type: 'jsonb', nullable: true })  metadata: Record<string, any>; // 메타데이터  @CreateDateColumn()  createdAt: Date;}
알림 유형 (NotificationType)
notification.entity.ts


Lines 11-20
export enum NotificationType {  BOOKING = 'booking',  PAYMENT = 'payment',  REVIEW = 'review',  MESSAGE = 'message',  AUCTION = 'auction',  QUOTE = 'quote',  RFQ = 'rfq',  SYSTEM = 'system',}
우선순위 (NotificationPriority)
notification.entity.ts
Lines 22-27
export enum NotificationPriority {  LOW = 'low',  NORMAL = 'normal',  HIGH = 'high',  URGENT = 'urgent',}


3. 서비스 계층
NotificationsService
주요 메서드:
notifications.service.ts
Lines 15-34
  async send(    userId: string,    type: NotificationType,    title: string,    message: string,    metadata?: Record<string, any>,  ): Promise<Notification> {    const notification = this.notificationRepository.create({      userId,      type,      title,      message,      metadata,    });    // In production, send push notification, SMS, email here    // For now, just save to database    return this.notificationRepository.save(notification);  }
send(): 알림 생성 및 저장
findByUser(): 사용자별 알림 조회(페이징, 필터링)
markAsRead(): 읽음 처리
FcmService
Firebase Cloud Messaging을 통한 푸시 알림 처리:
fcm.service.ts
Lines 58-165
  async sendPushNotification(    deviceTokens: string[],    notification: {      title: string;      body: string;      data?: Record<string, any>;      imageUrl?: string;    },  ): Promise<{ success: number; failure: number; errors: any[] }> {    if (!this.firebaseApp) {      this.logger.warn('Firebase not initialized. Skipping push notification.');      return { success: 0, failure: deviceTokens.length, errors: [] };    }    if (!deviceTokens || deviceTokens.length === 0) {      this.logger.warn('No device tokens provided');      return { success: 0, failure: 0, errors: [] };    }    // 유효한 토큰만 필터링    const validTokens = deviceTokens.filter(      (token) => token && token.trim().length > 0,    );    if (validTokens.length === 0) {      this.logger.warn('No valid device tokens found');      return { success: 0, failure: deviceTokens.length, errors: [] };    }    try {      // FCM 메시지 구성      const message: admin.messaging.MulticastMessage = {        notification: {          title: notification.title,          body: notification.body,          imageUrl: notification.imageUrl,        },        data: notification.data          ? Object.keys(notification.data).reduce((acc, key) => {              acc[key] = String(notification.data[key]);              return acc;            }, {} as Record<string, string>)          : undefined,        tokens: validTokens,        android: {          priority: 'high' as const,          notification: {            sound: 'default',            channelId: 'default',          },        },        apns: {          payload: {            aps: {              sound: 'default',              badge: 1,            },          },        },      };      // FCM 전송      const response = await admin.messaging().sendEachForMulticast(message);      const successCount = response.successCount;      const failureCount = response.failureCount;      const errors: any[] = [];      // 실패한 토큰 처리      if (response.responses) {        response.responses.forEach((resp, idx) => {          if (!resp.success) {            errors.push({              token: validTokens[idx],              error: resp.error,            });            // 토큰이 유효하지 않거나 등록 취소된 경우 로깅            if (              resp.error?.code === 'messaging/invalid-registration-token' ||              resp.error?.code === 'messaging/registration-token-not-registered'            ) {              this.logger.warn(                `Invalid or unregistered token: ${validTokens[idx]}`,              );            }          }        });      }      this.logger.log(        `Push notification sent: ${successCount} success, ${failureCount} failure`,      );      return {        success: successCount,        failure: failureCount,        errors,      };    } catch (error) {      this.logger.error('Error sending push notification:', error);      return {        success: 0,        failure: validTokens.length,        errors: [{ error: error.message }],      };    }  }
4. API 엔드포인트
NotificationsController
notifications.controller.ts
Lines 19-69
  @Get()  @ApiOperation({ summary: 'Get notification list' })  @ApiQuery({ name: 'type', required: false, enum: NotificationType })  @ApiQuery({ name: 'isRead', required: false, type: Boolean })  @ApiQuery({ name: 'page', required: false, type: Number })  @ApiQuery({ name: 'limit', required: false, type: Number })  @ApiOkResponse({ description: 'Notification list returned' })  findAll(    @GetUser() user: any,    @Query('type') type?: NotificationType,    @Query('isRead') isRead?: boolean,    @Query('page') page?: number,    @Query('limit') limit?: number,  ) {    return this.notificationsService.findByUser(user.id, type, isRead, page || 1, limit || 20);  }  @Post('send')  @ApiOperation({ summary: 'Send notification' })  @ApiOkResponse({ description: 'Notification sent successfully' })  send(    @Body() body: {      userId: string;      type: NotificationType;      title: string;      message: string;      metadata?: Record<string, any>;    },  ) {    return this.notificationsService.send(      body.userId,      body.type,      body.title,      body.message,      body.metadata,    );  }  @Patch(':id/read')  @ApiOperation({ summary: 'Mark notification as read' })  @ApiOkResponse({ description: 'Notification marked as read successfully' })  markAsRead(@GetUser() user: any, @Param('id') id: string) {    return this.notificationsService.markAsRead(user.id, id);  }  @Put(':id/read')  @ApiOperation({ summary: 'Mark notification as read (API spec compatible)' })  @ApiOkResponse({ description: 'Notification marked as read successfully' })  markAsReadPut(@GetUser() user: any, @Param('id') id: string) {    return this.notificationsService.markAsRead(user.id, id);  }
주요 엔드포인트:
GET /api/v1/notifications - 알림 목록 조회
POST /api/v1/notifications/send - 알림 전송
PATCH /api/v1/notifications/:id/read - 읽음 처리
POST /api/v1/notifications/test/push - FCM 푸시 테스트
5. 사용 예시
QuotesService에서 알림 전송
quotes.service.ts
Lines 179-191
        await this.notificationsService.send(        clientId,        NotificationType.QUOTE,        'New Quote Received',        `${providerName} has submitted a quote for your request: ${savedQuote.title}`,        {          quoteId: savedQuote.id,          rfqId: rfqId,          auctionId: createQuoteDto.auctionId,          providerId: providerId,          actionUrl: `/quotes/${savedQuote.id}`,        },      );
6. 특징
다중 채널 지원: 푸시, 이메일, SMS 플래그(현재는 DB 저장과 FCM 푸시 구현)
우선순위: LOW, NORMAL, HIGH, URGENT
만료 시간: expiresAt로 자동 만료
메타데이터: JSONB로 확장 데이터 저장
관련 엔티티 추적: relatedEntityType, relatedEntityId로 연결
읽음 상태: isRead, readAt로 추적
7. 모듈 의존성
notifications.module.ts
Lines 1-18
import { Module } from '@nestjs/common';import { TypeOrmModule } from '@nestjs/typeorm';import { NotificationsController } from './notifications.controller';import { NotificationsService } from './notifications.service';import { FcmService } from './fcm.service';import { Notification } from './entities/notification.entity';import { UsersModule } from '../users/users.module';@Module({  imports: [    TypeOrmModule.forFeature([Notification]),    UsersModule,  ],  controllers: [NotificationsController],  providers: [NotificationsService, FcmService],  exports: [NotificationsService, FcmService],})export class NotificationsModule {}
NotificationsService와 FcmService를 export하여 다른 모듈에서 사용 가능
QuotesModule, WebhooksModule 등에서 사용 중
8. 향후 개선 사항
현재 NotificationsService.send() 메서드에는 다음 주석이 있습니다:
// In production, send push notification, SMS, email here// For now, just save to database
향후 구현 가능한 기능:
푸시 알림 자동 전송(사용자 디바이스 토큰 조회 후 FCM 전송)
이메일 알림 전송
SMS 알림 전송
사용자별 알림 설정(채널별 on/off)
이 구조는 확장 가능하며, 다양한 비즈니스 로직에서 알림을 쉽게 전송할 수 있습니다.