import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString, IsOptional, IsUUID } from 'class-validator';

export class SpendCreditsDto {
  @ApiProperty({
    description: '사용할 크레딧 수량',
    example: 10,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  credits: number;

  @ApiProperty({
    description: '사용 사유',
    example: 'Auction bid',
  })
  @IsString()
  reason: string;

  @ApiProperty({
    description: '상세 설명 (선택사항)',
    example: 'Spent 10 credits to place bid on auction',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '관련 경매 ID (선택사항)',
    example: 'a98a4eb5-4b1e-4851-99c6-f92806ae5f61',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  relatedAuctionId?: string;

  @ApiProperty({
    description: '관련 예약 ID (선택사항)',
    example: 'a98a4eb5-4b1e-4851-99c6-f92806ae5f61',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  relatedBookingId?: string;
}

