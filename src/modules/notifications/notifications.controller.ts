import { Controller, Get, Post, Body, Patch, Put, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { FcmService } from './fcm.service';
import { NotificationType } from './entities/notification.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly fcmService: FcmService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get notification list' })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Notification list returned' })
  findAll(
    @GetUser() user: any,
    @Query('type') type?: NotificationType,
    @Query('isRead') isRead?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationsService.findByUser(user.id, type, isRead, page || 1, limit || 20);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send notification' })
  @ApiOkResponse({ description: 'Notification sent successfully' })
  send(
    @Body() body: {
      userId: string;
      type: NotificationType;
      title: string;
      message: string;
      metadata?: Record<string, any>;
    },
  ) {
    return this.notificationsService.send(
      body.userId,
      body.type,
      body.title,
      body.message,
      body.metadata,
    );
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiOkResponse({ description: 'Notification marked as read successfully' })
  markAsRead(@GetUser() user: any, @Param('id') id: string) {
    return this.notificationsService.markAsRead(user.id, id);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read (API spec compatible)' })
  @ApiOkResponse({ description: 'Notification marked as read successfully' })
  markAsReadPut(@GetUser() user: any, @Param('id') id: string) {
    return this.notificationsService.markAsRead(user.id, id);
  }

  @Post('test/push')
  @ApiOperation({
    summary: 'Test FCM push notification',
    description: 'FCM 푸시 알림을 테스트합니다. 실제 디바이스 토큰이 필요합니다.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        deviceTokens: {
          type: 'array',
          items: { type: 'string' },
          description: '디바이스 토큰 배열',
          example: ['device-token-1', 'device-token-2'],
        },
        title: {
          type: 'string',
          description: '알림 제목',
          example: '테스트 알림',
        },
        body: {
          type: 'string',
          description: '알림 내용',
          example: '이것은 FCM 테스트 알림입니다.',
        },
        data: {
          type: 'object',
          description: '추가 데이터 (선택사항)',
          example: { requestId: 'REQ-2025-001234', category: 'Home Services' },
        },
      },
      required: ['deviceTokens', 'title', 'body'],
    },
  })
  @ApiOkResponse({
    description: 'Push notification test result',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'number', description: '성공한 전송 수' },
        failure: { type: 'number', description: '실패한 전송 수' },
        errors: {
          type: 'array',
          description: '에러 목록',
          items: { type: 'object' },
        },
      },
    },
  })
  async testPushNotification(
    @Body()
    body: {
      deviceTokens: string[];
      title: string;
      body: string;
      data?: Record<string, any>;
    },
  ) {
    return this.fcmService.sendPushNotification(body.deviceTokens, {
      title: body.title,
      body: body.body,
      data: body.data,
    });
  }
}
