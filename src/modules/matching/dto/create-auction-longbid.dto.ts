import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsArray,
  IsObject,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class PriceBreakdownItemDto {
  @ApiProperty({ example: 'Labor' })
  @IsString()
  item: string;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(0)
  amount: number;
}

export class AdditionalDetailsDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  methodology?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  materials_included?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  materials_excluded?: string[];

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  warranty_days?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  warranty_description?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  competitive_advantages?: string[];
}

export class CreateAuctionLongBidDto {
  @ApiProperty({ example: 'auc-123' })
  @IsString()
  auctionId: string;

  @ApiProperty({ example: 1700 })
  @IsNumber()
  @Min(0)
  quotedPrice: number;

  @ApiProperty({
    type: [PriceBreakdownItemDto],
    example: [
      { item: 'Labor', amount: 1000 },
      { item: 'Materials', amount: 700 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceBreakdownItemDto)
  priceBreakdown: PriceBreakdownItemDto[];

  @ApiProperty({ example: 2, required: false })
  @IsNumber()
  @IsOptional()
  estimatedHours?: number;

  @ApiProperty({ example: '2025-01-15', required: false })
  @IsDateString()
  @IsOptional()
  proposedStartDate?: string;

  @ApiProperty({ example: '09:00', required: false })
  @IsString()
  @IsOptional()
  proposedStartTime?: string;

  @ApiProperty({
    type: [String],
    example: ['https://cdn.example.com/1.jpg'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  portfolioImages?: string[];

  @ApiProperty({ type: AdditionalDetailsDto, required: false })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => AdditionalDetailsDto)
  additional_details?: AdditionalDetailsDto;
}
