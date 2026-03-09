import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AcceptBookingQueueItemDto {
  @ApiProperty({ example: 'b123e4567-e89b-12d3-a456-426614174000', description: 'instant_booking id' })
  @IsUUID()
  @IsNotEmpty()
  booking_id: string;

  @ApiProperty({ example: 'a98a4eb5-4b1e-4851-99c6-f92806ae5f61', description: 'Provider UUID' })
  @IsUUID()
  @IsNotEmpty()
  provider_id: string;

  @ApiProperty({ example: '7f8cefb6-e2da-47de-8b5b-dca8808d7495', description: 'service_listings id (item)' })
  @IsUUID()
  @IsNotEmpty()
  item_id: string;
}
