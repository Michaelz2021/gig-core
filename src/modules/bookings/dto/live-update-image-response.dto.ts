import { ApiProperty } from '@nestjs/swagger';

export class LiveUpdateImageResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Live update image ID' })
  id: string;

  @ApiProperty({ format: 'uuid', description: 'Booking ID' })
  bookingId: string;

  @ApiProperty({ description: 'Image URL' })
  imageUrl: string;

  @ApiProperty({ format: 'date-time', description: 'Created at' })
  createdAt: Date;
}
