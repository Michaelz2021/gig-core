import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsNumber, IsEnum, MinLength, MaxLength } from 'class-validator';

export class UpdateUserProfileDto {
  @ApiProperty({ example: 'I am a professional service provider with 5 years of experience...', required: false, description: 'Bio (minimum 50 characters)' })
  @IsOptional()
  @IsString()
  @MinLength(50, { message: 'Bio must be at least 50 characters long' })
  bio?: string;

  @ApiProperty({ example: '123 Main Street', required: false })
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiProperty({ example: 'Apt 4B', required: false })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ example: 'Manila', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'Metro Manila', required: false })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({ example: '1000', required: false })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ example: 'PH', required: false, default: 'PH' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  @ApiProperty({ example: 14.5995, required: false, description: 'Latitude (GPS)' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ example: 120.9842, required: false, description: 'Longitude (GPS)' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ example: 'en', required: false, default: 'en' })
  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  @ApiProperty({ example: 'PHP', required: false, default: 'PHP' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  preferredCurrency?: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsOptional()
  @IsBoolean()
  notificationEmail?: boolean;

  @ApiProperty({ example: true, required: false, default: true })
  @IsOptional()
  @IsBoolean()
  notificationSms?: boolean;

  @ApiProperty({ example: true, required: false, default: true })
  @IsOptional()
  @IsBoolean()
  notificationPush?: boolean;
}

