import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { RateType } from '../entities/service.entity';

export class SearchServiceDto {
  @ApiProperty({ required: false, example: 'cleaning' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({ required: false, example: 'cleaning' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiProperty({ required: false, example: 'hourly', enum: RateType })
  @IsOptional()
  @IsEnum(RateType)
  rateType?: RateType;

  @ApiProperty({ required: false, example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minRate?: number;

  @ApiProperty({ required: false, example: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxRate?: number;
}

