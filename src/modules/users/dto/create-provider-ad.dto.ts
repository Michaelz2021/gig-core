import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsDateString, IsUUID, MaxLength, Min, Max } from 'class-validator';

export class CreateProviderAdDto {
  @ApiProperty({ example: '93e01171-95c5-4734-a509-3ab43f008837', description: 'Provider ID' })
  @IsUUID()
  providerId: string;

  @ApiPropertyOptional({ example: 'https://example.com/images/background.jpg', description: '배경 이미지 URL' })
  @IsOptional()
  @IsString()
  backgroundImageUrl?: string;

  @ApiProperty({ example: 'Juan Dela Cruz Home Services', description: 'Provider 이름 (회사명 또는 개인명)' })
  @IsString()
  @MaxLength(255)
  providerName: string;

  @ApiPropertyOptional({ example: 'Home Services', description: '서비스 영역' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  serviceArea?: string;

  @ApiPropertyOptional({ example: ['Moving', 'Cleaning', 'Repair'], type: [String], description: '서비스 카테고리 배열' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceCategories?: string[];

  @ApiPropertyOptional({ example: 'Professional moving services with care', description: '홍보 배너 메시지' })
  @IsOptional()
  @IsString()
  promoMessage?: string;

  @ApiPropertyOptional({ example: 'Special Offer 1', description: '홍보 제목' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  promoTitle?: string;

  @ApiPropertyOptional({ example: true, description: '할인 이벤트 여부' })
  @IsOptional()
  @IsBoolean()
  hasDiscount?: boolean;

  @ApiPropertyOptional({ example: 20.00, description: '할인율 (%)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @ApiPropertyOptional({ example: 1000.00, description: '할인 금액' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ example: 'Get up to 20% off', description: '할인 설명' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  discountDescription?: string;

  @ApiPropertyOptional({ example: '2026-01-10T00:00:00Z', description: '할인 시작일' })
  @IsOptional()
  @IsDateString()
  discountStartDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59Z', description: '할인 종료일' })
  @IsOptional()
  @IsDateString()
  discountEndDate?: string;

  @ApiPropertyOptional({ example: '2026-01-10T00:00:00Z', description: '광고 노출 시작일' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59Z', description: '광고 노출 종료일' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: '/providers/93e01171-95c5-4734-a509-3ab43f008837', description: '액션 URL (버튼 클릭 시 이동)' })
  @IsOptional()
  @IsString()
  actionUrl?: string;

  @ApiPropertyOptional({ example: 'Learn More', description: '액션 버튼 텍스트' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  actionText?: string;

  @ApiPropertyOptional({ example: 0, description: '우선순위 (높을수록 먼저 표시)', default: 0 })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional({ example: true, description: '활성화 여부', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

