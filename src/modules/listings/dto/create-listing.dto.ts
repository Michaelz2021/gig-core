import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateListingDto {
  @ApiProperty({ description: 'Service category UUID' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 'Quick Home Cleaning', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiPropertyOptional({ description: 'Listing description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'FIXED', enum: ['FIXED', 'VARIANT', 'ADDON'], default: 'FIXED' })
  @IsOptional()
  @IsIn(['FIXED', 'VARIANT', 'ADDON'])
  pricingType?: 'FIXED' | 'VARIANT' | 'ADDON';

  @ApiPropertyOptional({ example: 500.5, description: 'Fixed price (PHP). Required when pricingType is FIXED.' })
  @ValidateIf((o) => o.pricingType !== 'VARIANT' && o.pricingType !== 'ADDON')
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  fixedPrice?: number;

  @ApiPropertyOptional({
    description: 'Pricing rules (e.g. extraPersonPrice, maxPersonCount, travelFeeEnabled, travelFeePerKm, travelFreeRadiusKm)',
  })
  @IsOptional()
  @IsObject()
  pricingRules?: Record<string, unknown>;

  @ApiProperty({ example: 60, description: 'Duration in minutes' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  durationMinutes: number;

  @ApiPropertyOptional({ description: 'Service areas (e.g. cities or regions)' })
  @IsOptional()
  serviceAreas?: string[] | Record<string, unknown>;

  @ApiPropertyOptional({ example: 1, default: 1, description: 'Advance notice in hours' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  advanceNoticeHours?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isInstantBook?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Photo URLs' })
  @IsOptional()
  photos?: string[] | Record<string, unknown>[];
}
