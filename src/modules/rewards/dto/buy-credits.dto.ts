import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsOptional, IsString } from 'class-validator';

export class BuyCreditsDto {
  @ApiProperty({
    description: 'Number of credits to purchase',
    example: 100,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  credits: number;

  @ApiProperty({
    description: 'Purchase reason (optional)',
    example: 'Auction bid credits',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'Detail description (optional)',
    example: 'Purchased 100 credits for auction bidding',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

