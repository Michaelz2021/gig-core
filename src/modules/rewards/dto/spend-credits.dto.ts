import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString, IsOptional, IsUUID } from 'class-validator';

export class SpendCreditsDto {
  @ApiProperty({
    description: 'Number of credits to spend',
    example: 10,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  credits: number;

  @ApiProperty({
    description: 'Spend reason',
    example: 'Auction bid',
  })
  @IsString()
  reason: string;

  @ApiProperty({
    description: 'Detail description (optional)',
    example: 'Spent 10 credits to place bid on auction',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Related auction ID (optional)',
    example: 'a98a4eb5-4b1e-4851-99c6-f92806ae5f61',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  relatedAuctionId?: string;

  @ApiProperty({
    description: 'Related booking ID (optional)',
    example: 'a98a4eb5-4b1e-4851-99c6-f92806ae5f61',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  relatedBookingId?: string;
}

