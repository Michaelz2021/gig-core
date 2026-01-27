import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AuctionBidStatus } from '../entities/auction-bid.entity';

export class UpdateBidStatusDto {
  @ApiProperty({
    description: 'Bid 상태',
    enum: AuctionBidStatus,
    enumName: 'AuctionBidStatus',
    example: 'under_review',
  })
  @IsEnum(AuctionBidStatus, {
    message: 'status must be one of: submitted, under_review, shortlisted, selected, rejected',
  })
  status: AuctionBidStatus;

  @ApiProperty({
    description: '상태 변경 사유 (선택사항)',
    required: false,
    example: '검토 중입니다',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

