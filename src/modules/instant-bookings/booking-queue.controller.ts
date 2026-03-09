import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { InstantBookingsService } from './instant-bookings.service';
import { AcceptBookingQueueItemDto } from './dto/accept-booking-queue-item.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('booking-queue')
@Controller('booking-queue')
export class BookingQueueController {
  constructor(private readonly instantBookingsService: InstantBookingsService) {}

  @Public()
  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Provider accept queue item',
    description:
      'Provider가 대기열 항목을 수락합니다. item_id로 service_listings를 조회하고, booking_id로 instant_booking을 조회한 뒤 ack_item_list에 ACCEPTED 항목을 추가합니다.',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking ID (instant_booking id). Path의 id와 body의 booking_id는 동일한 값으로 넣으세요.',
    example: '46dffc5b-408d-41e3-8344-ef54d433a2f6',
  })
  @ApiBody({
    type: AcceptBookingQueueItemDto,
    description: 'booking_id, provider_id, item_id는 반드시 따옴표 하나로 감싼 문자열(UUID)로 보내세요. 잘못된 예: "booking_id": ""uuid"  올바른 예: "booking_id": "uuid"',
    examples: {
      accept: {
        summary: '수락 요청 (path id와 booking_id 동일)',
        value: {
          booking_id: '46dffc5b-408d-41e3-8344-ef54d433a2f6',
          provider_id: 'a98a4eb5-4b1e-4851-99c6-f92806ae5f61',
          item_id: '1d2fa65a-d6d4-4875-8492-2b50676602ec',
        },
      },
      another: {
        summary: '다른 booking 예시',
        value: {
          booking_id: 'b123e4567-e89b-12d3-a456-426614174000',
          provider_id: 'a98a4eb5-4b1e-4851-99c6-f92806ae5f61',
          item_id: '7f8cefb6-e2da-47de-8b5b-dca8808d7495',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '수락 완료, ack_item_list 반환',
    schema: {
      type: 'object',
      properties: {
        booking_id: { type: 'string', format: 'uuid' },
        ack_item_list: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              itemid: { type: 'string', format: 'uuid' },
              provider_response: { type: 'string', example: 'ACCEPTED' },
              provider_response_at: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Provider does not own listing or item already accepted' })
  @ApiResponse({ status: 404, description: 'Service listing or instant booking not found' })
  accept(@Param('id') id: string, @Body() dto: AcceptBookingQueueItemDto) {
    return this.instantBookingsService.acceptQueueItem(
      dto.booking_id,
      dto.provider_id,
      dto.item_id,
    );
  }
}
