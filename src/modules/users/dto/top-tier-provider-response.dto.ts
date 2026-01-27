import { ApiProperty } from '@nestjs/swagger';

export class CategoryDto {
  @ApiProperty({ example: '28157e44-f4d7-4399-9612-372b5e3bf697' })
  id: string;

  @ApiProperty({ example: 'Home Services' })
  name: string;
}

export class TopTierProviderItemDto {
  @ApiProperty({ example: 1, description: '랭킹 위치' })
  ranking: number;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  providerId: string;

  @ApiProperty({ example: '41ea62f4-8329-42ef-a9e3-b38360c76626' })
  userId: string;

  @ApiProperty({ example: 'Juan Dela Cruz', required: false })
  name?: string;

  @ApiProperty({ example: 'Professional Services Co.', required: false })
  businessName?: string;

  @ApiProperty({ example: 'Professional Services Co.' })
  displayName: string;

  @ApiProperty({ type: CategoryDto, required: false })
  primaryCategory?: CategoryDto;

  @ApiProperty({ example: ['Plumbing', 'Carpentry'], type: [String] })
  categories: string[];

  @ApiProperty({ example: 892.5 })
  totalScore: number;

  @ApiProperty({ example: 850 })
  trustScore: number;

  @ApiProperty({ example: 4.8 })
  ratingScore: number;

  @ApiProperty({ example: 98.5 })
  completionRateScore: number;

  @ApiProperty({ example: 95.2 })
  responseTimeScore: number;

  @ApiProperty({ example: 150, description: '리뷰 수 점수' })
  reviewCountScore?: number;

  @ApiProperty({ example: 'https://api.example.com/images/provider_123.jpg', required: false })
  profileImageUrl?: string;

  @ApiProperty({ example: true })
  isVerified: boolean;

  @ApiProperty({ example: 127 })
  totalJobsCompleted: number;

  @ApiProperty({ example: 150 })
  totalReviews: number;

  @ApiProperty({ example: 4.8 })
  averageRating: number;

  @ApiProperty({ example: '2026-01-10T03:30:00Z' })
  lastCalculatedAt: Date;
}

export class TopTierProvidersResponseDto {
  @ApiProperty({ type: [TopTierProviderItemDto] })
  items: TopTierProviderItemDto[];

  @ApiProperty({ example: 10 })
  totalCount: number;

  @ApiProperty({ example: '2026-01-10T03:30:00Z' })
  lastUpdated: Date;
}

