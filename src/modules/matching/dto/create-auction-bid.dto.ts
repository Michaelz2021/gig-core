import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDateString, IsArray, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PortfolioItemDto {
  @ApiProperty({ description: '포트폴리오 이미지 URL' })
  @IsString()
  url: string;

  @ApiProperty({ description: '포트폴리오 이미지 캡션', required: false })
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiProperty({ description: '포트폴리오 설명 (quote description)', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateAuctionBidDto {
  @ApiProperty({ description: '경매 ID' })
  @IsString()
  auctionId: string;

  @ApiProperty({ description: '제안 가격' })
  @IsNumber()
  @Min(0)
  proposedPrice: number;

  @ApiProperty({ description: '예상 소요 일수', required: false })
  @IsNumber()
  @IsOptional()
  estimatedDuration?: number;

  @ApiProperty({ description: '작업 계획서 (quote description)', required: false })
  @IsString()
  @IsOptional()
  workPlan?: string;

  @ApiProperty({ 
    description: '포트폴리오 항목 배열 (quote description 포함)', 
    type: [PortfolioItemDto],
    required: false 
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PortfolioItemDto)
  @IsOptional()
  portfolioItems?: PortfolioItemDto[];

  @ApiProperty({ description: '제안 시작 날짜 (ISO 8601)', required: false })
  @IsDateString()
  @IsOptional()
  proposedStartDate?: string;

  @ApiProperty({ description: '제안 완료 날짜 (ISO 8601)', required: false })
  @IsDateString()
  @IsOptional()
  proposedCompletionDate?: string;

  @ApiProperty({ description: '추가 코멘트', required: false })
  @IsString()
  @IsOptional()
  additionalComment?: string;
}

