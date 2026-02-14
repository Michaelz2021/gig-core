import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString, IsOptional } from 'class-validator';

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
    description: 'Related booking number (optional)',
    example: 'BOOK-1770436511571-SKNP2R5QV',
    required: false,
  })
  @IsOptional()
  @IsString()
  relatedBookingNumber?: string;
}

