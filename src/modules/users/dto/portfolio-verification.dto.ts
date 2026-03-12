import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsNumber,
  IsArray,
  IsObject,
  IsOptional,
  IsIn,
  Min,
  Max,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

const DAY_MAP: Record<string, number> = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sun: 7,
};

export function mapAvailableDaysToNumbers(days: string[]): number[] {
  if (!Array.isArray(days)) return [];
  return days
    .map((d) => (typeof d === 'string' ? DAY_MAP[d.toLowerCase()] : null))
    .filter((n): n is number => n != null);
}

export class BusinessAddressDto {
  @ApiPropertyOptional({ example: '123 Main St' })
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiPropertyOptional({ example: 'Unit 4' })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional({ example: 'Manila' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'NCR' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({ example: '1000' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({ example: 'PH' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;
}

export class CertificationItemDto {
  @ApiProperty({ example: 'TESDA NC II' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'TESDA' })
  @IsString()
  issuer: string;

  @ApiProperty({ example: '2023-01-15' })
  @IsString()
  issueDate: string;

  @ApiProperty({ example: '2028-01-14' })
  @IsString()
  expiryDate: string;

  @ApiProperty({ example: 'https://...' })
  @IsString()
  certificateUrl: string;
}

export class PortfolioPhotoItemDto {
  @ApiProperty({ example: 'https://cdn.example.com/uploaded/photo1.jpg' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ example: 'Aircon cleaning project' })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ example: '2025-03-11T10:00:00Z' })
  @IsOptional()
  @IsString()
  uploadedAt?: string;
}

export class NotificationPreferencesDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;
}

export class PortfolioVerificationDto {
  @ApiPropertyOptional({ example: 'ABC Services' })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiProperty({ example: 'company', enum: ['individual', 'company'] })
  @IsString()
  @IsIn(['individual', 'company'])
  businessType: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  vatable?: boolean;

  @ApiPropertyOptional({ type: BusinessAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessAddressDto)
  businessAddress?: BusinessAddressDto;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  tinNumber?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(99)
  yearsOfExperience?: number;

  @ApiPropertyOptional({ type: [CertificationItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationItemDto)
  certifications?: CertificationItemDto[];

  @ApiPropertyOptional({ type: [PortfolioPhotoItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PortfolioPhotoItemDto)
  portfolioPhotos?: PortfolioPhotoItemDto[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    example: ['mon', 'tue', 'wed', 'thu', 'fri'],
    description: 'Day codes: mon, tue, wed, thu, fri, sat, sun → stored as 1-7',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availableDays?: string[];

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  availableHoursStart?: string;

  @ApiPropertyOptional({ example: '18:00' })
  @IsOptional()
  @IsString()
  availableHoursEnd?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  instantBookingEnabled?: boolean;

  @ApiPropertyOptional({ example: 10.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  serviceRadiusKm?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1440)
  responseTimeMinutes?: number;

  @ApiPropertyOptional({ type: NotificationPreferencesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationPreferencesDto)
  notificationPreferences?: NotificationPreferencesDto;
}

/** Response data for POST /provider/verification/portfolio */
export class PortfolioVerificationDataDto {
  @ApiProperty({ format: 'uuid', description: 'Provider ID' })
  provider_id: string;
}

/** Swagger 응답 스키마: POST /provider/verification/portfolio */
export class PortfolioVerificationResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Portfolio verification submitted' })
  message: string;

  @ApiProperty({ type: PortfolioVerificationDataDto })
  data: PortfolioVerificationDataDto;
}
