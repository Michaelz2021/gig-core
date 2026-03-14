import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsDateString,
  Min,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInstantInvoiceDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  listing_id: string;

  @ApiPropertyOptional({ description: 'JWT consumer와 일치해야 함' })
  @IsOptional()
  @IsUUID()
  consumer_id?: string;

  @ApiPropertyOptional({ description: '없으면 listing_id로 리스팅 조회 후 provider_id 사용' })
  @IsOptional()
  @IsUUID()
  provider_id?: string;

  @ApiProperty()
  @IsUUID()
  instant_booking_id: string;

  @ApiProperty({ example: '2025-02-01' })
  @IsDateString()
  service_date: string;

  @ApiProperty({ example: '14:00:00' })
  @IsString()
  service_time: string;

  @ApiProperty({ example: '123 Main St, Manila' })
  @IsString()
  service_address: string;

  @ApiProperty({ example: 'Home', enum: ['Home', 'On Site'], description: '서비스 장소 옵션' })
  @IsIn(['Home', 'On Site'])
  service_address_option: 'Home' | 'On Site';

  @ApiPropertyOptional({ description: '미입력 시 listing_id로 조회한 리스팅명으로 채움' })
  @IsOptional()
  @IsString()
  listing_name?: string;

  @ApiPropertyOptional({ description: '미입력 시 consumer_id(유저) 기준 표시명으로 채움' })
  @IsOptional()
  @IsString()
  consumer_name?: string;

  @ApiPropertyOptional({ description: '미입력 시 provider_id 기준 표시명으로 채움' })
  @IsOptional()
  @IsString()
  provider_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  service_lat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  service_lng?: number;

  @ApiProperty({ example: 'VARIANT', enum: ['FIXED', 'VARIANT'] })
  @IsIn(['FIXED', 'VARIANT'])
  price_type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  variant_id?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  addon_item_ids?: string[];

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  extra_person_count?: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  base_price: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  addons_total?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  person_fee?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  travel_fee?: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  final_price: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  service_amount: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  platform_fee: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vatable_amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vat_amount?: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total_amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  consumer_notes?: string;
}
