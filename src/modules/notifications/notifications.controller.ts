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
    description: 'Test FCM push notification. Requires actual device token(s).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        deviceTokens: {
          type: 'array',
          items: { type: 'string' },
          description: 'Device token array',
          example: ['device-token-1', 'device-token-2'],
        },
        title: {
          type: 'string',
          description: 'Notification title',
            example: 'Test notification',
        },
        body: {
          type: 'string',
          description: 'Notification body',
            example: 'This is an FCM test notification.',
        },
        data: {
          type: 'object',
          description: 'Additional data (optional)',
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
        success: { type: 'number', description: 'Number of successful sends' },
        failure: { type: 'number', description: 'Number of failed sends' },
        errors: {
          type: 'array',
          description: 'Error list',
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
