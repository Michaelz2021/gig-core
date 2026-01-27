import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProviderAdResponseDto {
  @ApiProperty({ example: '93e01171-95c5-4734-a509-3ab43f008837' })
  id: string;

  @ApiProperty({ example: '93e01171-95c5-4734-a509-3ab43f008837' })
  providerId: string;

  @ApiPropertyOptional({ example: 'https://example.com/images/background.jpg' })
  backgroundImageUrl?: string;

  @ApiProperty({ example: 'Juan Dela Cruz Home Services' })
  providerName: string;

  @ApiPropertyOptional({ example: 'Home Services' })
  serviceArea?: string;

  @ApiProperty({ example: ['Moving', 'Cleaning', 'Repair'], type: [String] })
  serviceCategories: string[];

  @ApiPropertyOptional({ example: 'Professional moving services with care' })
  promoMessage?: string;

  @ApiPropertyOptional({ example: 'Special Offer 1' })
  promoTitle?: string;

  @ApiProperty({ example: true })
  hasDiscount: boolean;

  @ApiPropertyOptional({ example: 20.00 })
  discountPercentage?: number;

  @ApiPropertyOptional({ example: 1000.00 })
  discountAmount?: number;

  @ApiPropertyOptional({ example: 'Get up to 20% off' })
  discountDescription?: string;

  @ApiPropertyOptional({ example: '2026-01-10T00:00:00Z' })
  discountStartDate?: Date;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59Z' })
  discountEndDate?: Date;

  @ApiPropertyOptional({ example: '2026-01-10T00:00:00Z' })
  startDate?: Date;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59Z' })
  endDate?: Date;

  @ApiPropertyOptional({ example: '/providers/93e01171-95c5-4734-a509-3ab43f008837' })
  actionUrl?: string;

  @ApiProperty({ example: 'Learn More' })
  actionText: string;

  @ApiProperty({ example: 0 })
  priority: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-01-10T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-10T00:00:00Z' })
  updatedAt: Date;
}

export class ProviderAdsListResponseDto {
  @ApiProperty({ type: [ProviderAdResponseDto] })
  items: ProviderAdResponseDto[];

  @ApiProperty({ example: 10 })
  totalCount: number;
}

