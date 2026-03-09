import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { InstantBookingsService } from './instant-bookings.service';
import { CreateInstantBookingDto } from './dto/create-instant-booking.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('instant-bookings')
@Controller('instant-bookings')
export class InstantBookingsController {
  constructor(private readonly instantBookingsService: InstantBookingsService) {}

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Get instant booking by ID',
    description: 'ID로 instant_booking 한 건을 조회합니다. 앱에서 예약 상세/상태 확인 시 사용.',
  })
  @ApiParam({ name: 'id', description: 'Instant booking UUID', example: 'c49a3875-719f-4b7d-be8b-27686d10c6c4' })
  @ApiResponse({ status: 200, description: 'Instant booking 상세 (id, user_id, service_category_id, time_slot, location, price_range, ack_item_list, status, created_at, updated_at)' })
  @ApiResponse({ status: 404, description: 'Not found' })
  findOne(@Param('id') id: string) {
    return this.instantBookingsService.findOne(id);
  }

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create instant booking request',
    description:
      'Creates a new instant booking request and stores it in instant_bookings. Returns booking_id, status (PENDING), and created_at.',
  })
  @ApiBody({
    type: CreateInstantBookingDto,
    description: 'Request body: user_id, service_category, time_slot, location. price_range는 사용하지 않음(instant booking은 고정 가격).',
    examples: {
      snakeCase: {
        summary: 'Snake case (e.g. from app)',
        value: {
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          service_category: 'a98a4eb5-4b1e-4851-99c6-f92806ae5f61',
          time_slot: '2024-07-01T14:00:00Z',
          location: { address: '123 Main St, Anytown, USA', lat: 37.7749, lng: -122.4194 },
        },
      },
      camelCase: {
        summary: 'Camel case',
        value: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          serviceCategoryId: 'a98a4eb5-4b1e-4851-99c6-f92806ae5f61',
          timeSlot: '2024-07-01T14:00:00Z',
          location: { address: '123 Main St, Anytown, USA', lat: 37.7749, lng: -122.4194 },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Instant booking created',
    schema: {
      type: 'object',
      properties: {
        booking_id: { type: 'string', format: 'uuid', example: 'b123e4567-e89b-12d3-a456-426614174000' },
        status: { type: 'string', example: 'PENDING' },
        created_at: { type: 'string', format: 'date-time', example: '2024-06-30T12:00:00Z' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateInstantBookingDto) {
    return this.instantBookingsService.create(dto);
  }
}
