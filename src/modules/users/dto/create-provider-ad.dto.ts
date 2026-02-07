import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsDateString, IsUUID, MaxLength, Min, Max } from 'class-validator';

export class CreateProviderAdDto {
  @ApiProperty({ example: '93e01171-95c5-4734-a509-3ab43f008837', description: 'Provider ID' })
  @IsUUID()
  providerId: string;

  @ApiPropertyOptional({ example: 'https://example.com/images/background.jpg', description: 'Background image URL' })
  @IsOptional()
  @IsString()
  backgroundImageUrl?: string;

  @ApiProperty({ example: 'Juan Dela Cruz Home Services', description: 'Provider name (company or individual)' })
  @IsString()
  @MaxLength(255)
  providerName: string;

  @ApiPropertyOptional({ example: 'Home Services', description: 'Service area' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  serviceArea?: string;

  @ApiPropertyOptional({ example: ['Moving', 'Cleaning', 'Repair'], type: [String], description: 'Service categories array' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceCategories?: string[];

  @ApiPropertyOptional({ example: 'Professional moving services with care', description: 'Promo banner message' })
  @IsOptional()
  @IsString()
  promoMessage?: string;

  @ApiPropertyOptional({ example: 'Special Offer 1', description: 'Promo title' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  promoTitle?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether discount event is active' })
  @IsOptional()
  @IsBoolean()
  hasDiscount?: boolean;

  @ApiPropertyOptional({ example: 20.00, description: 'Discount percentage (%)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @ApiPropertyOptional({ example: 1000.00, description: 'Discount amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ example: 'Get up to 20% off', description: 'Discount description' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  discountDescription?: string;

  @ApiPropertyOptional({ example: '2026-01-10T00:00:00Z', description: 'Discount start date' })
  @IsOptional()
  @IsDateString()
  discountStartDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59Z', description: 'Discount end date' })
  @IsOptional()
  @IsDateString()
  discountEndDate?: string;

  @ApiPropertyOptional({ example: '2026-01-10T00:00:00Z', description: 'Ad display start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59Z', description: 'Ad display end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: '/providers/93e01171-95c5-4734-a509-3ab43f008837', description: 'Action URL (navigate on button click)' })
  @IsOptional()
  @IsString()
  actionUrl?: string;

  @ApiPropertyOptional({ example: 'Learn More', description: 'Action button text' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  actionText?: string;

  @ApiPropertyOptional({ example: 0, description: 'Priority (higher shown first)', default: 0 })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional({ example: true, description: 'Active status', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

