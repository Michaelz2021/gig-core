import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDateString, IsArray, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PortfolioItemDto {
  @ApiPropertyOptional()
  @IsString()
  url: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateAuctionBidDto {
  @ApiPropertyOptional({ description: 'Proposed price' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  proposedPrice?: number;

  @ApiPropertyOptional({ description: 'Estimated duration (days)' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  estimatedDuration?: number;

  @ApiPropertyOptional({ description: 'Work plan' })
  @IsString()
  @IsOptional()
  workPlan?: string;

  @ApiPropertyOptional({ type: [PortfolioItemDto], description: 'Portfolio items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PortfolioItemDto)
  @IsOptional()
  portfolioItems?: PortfolioItemDto[];

  @ApiPropertyOptional({ description: 'Proposed start date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  proposedStartDate?: string;

  @ApiPropertyOptional({ description: 'Proposed completion date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  proposedCompletionDate?: string;

  @ApiPropertyOptional({ description: 'Additional comment' })
  @IsString()
  @IsOptional()
  additionalComment?: string;
}
