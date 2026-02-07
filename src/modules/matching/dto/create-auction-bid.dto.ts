import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDateString, IsArray, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PortfolioItemDto {
  @ApiProperty({ description: 'Portfolio image URL' })
  @IsString()
  url: string;

  @ApiProperty({ description: '포트폴리오 이미지 캡션', required: false })
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiProperty({ description: 'Portfolio description', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateAuctionBidDto {
  @ApiProperty({ description: 'Auction ID' })
  @IsString()
  auctionId: string;

  @ApiProperty({ description: 'Proposed price' })
  @IsNumber()
  @Min(0)
  proposedPrice: number;

  @ApiProperty({ description: 'Estimated duration (days)', required: false })
  @IsNumber()
  @IsOptional()
  estimatedDuration?: number;

  @ApiProperty({ description: 'Work plan', required: false })
  @IsString()
  @IsOptional()
  workPlan?: string;

  @ApiProperty({ 
    description: 'Portfolio items array', 
    type: [PortfolioItemDto],
    required: false 
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PortfolioItemDto)
  @IsOptional()
  portfolioItems?: PortfolioItemDto[];

  @ApiProperty({ description: 'Proposed start date (ISO 8601)', required: false })
  @IsDateString()
  @IsOptional()
  proposedStartDate?: string;

  @ApiProperty({ description: 'Proposed completion date (ISO 8601)', required: false })
  @IsDateString()
  @IsOptional()
  proposedCompletionDate?: string;

  @ApiProperty({ description: 'Additional comment', required: false })
  @IsString()
  @IsOptional()
  additionalComment?: string;
}

