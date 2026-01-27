import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsOptional, IsString } from 'class-validator';

export class BuyCreditsDto {
  @ApiProperty({
    description: '구매할 크레딧 수량',
    example: 100,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  credits: number;

  @ApiProperty({
    description: '구매 사유 (선택사항)',
    example: 'Auction bid credits',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: '상세 설명 (선택사항)',
    example: 'Purchased 100 credits for auction bidding',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

