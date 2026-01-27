import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional, IsArray, Min } from 'class-validator';
import { RateType } from '../entities/service.entity';

export class CreateServiceDto {
  @ApiProperty({ example: 'cleaning' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'House Cleaning Service' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Professional house cleaning service' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 500.0 })
  @IsNumber()
  @Min(0)
  rate: number;

  @ApiProperty({ example: 'hourly', enum: RateType })
  @IsEnum(RateType)
  rateType: RateType;

  @ApiProperty({ required: false, example: ['https://example.com/img1.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ required: false, example: ['cleaning', 'house'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

