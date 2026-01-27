import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum ProviderSortBy {
  TRUST_SCORE = 'trustScore',
  RATING = 'rating',
  PRICE = 'price',
  DISTANCE = 'distance',
  NEWEST = 'newest',
  CREATED_AT = 'createdAt',
}

export class GetProvidersDto {
  @ApiProperty({ description: 'Service category', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ description: 'Location filter', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Minimum trust score', required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(1000)
  minTrustScore?: number;

  @ApiProperty({ description: 'Maximum price', required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  maxPrice?: number;

  @ApiProperty({ description: 'Sort by', enum: ProviderSortBy, required: false })
  @IsEnum(ProviderSortBy)
  @IsOptional()
  sortBy?: ProviderSortBy;

  @ApiProperty({ description: 'Page number', default: 1, required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', default: 20, required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

