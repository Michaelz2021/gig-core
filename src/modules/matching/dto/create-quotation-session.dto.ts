import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDateString, IsArray, Min, Max } from 'class-validator';

export class CreateQuotationSessionDto {
  @ApiProperty({ description: '서비스 카테고리', required: false })
  @IsString()
  @IsOptional()
  serviceCategory?: string;

  @ApiProperty({ description: '서비스 설명', required: false })
  @IsString()
  @IsOptional()
  serviceDescription?: string;

  @ApiProperty({ description: '서비스 위치', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: '희망 날짜', required: false })
  @IsDateString()
  @IsOptional()
  preferredDate?: string;

  @ApiProperty({ description: '희망 시간', required: false })
  @IsString()
  @IsOptional()
  preferredTime?: string;

  @ApiProperty({ description: '예산 최소값', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  budgetRangeMin?: number;

  @ApiProperty({ description: '예산 최대값', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  budgetRangeMax?: number;

  @ApiProperty({ description: '특별 요구사항', required: false })
  @IsString()
  @IsOptional()
  specialRequirements?: string;

  @ApiProperty({ description: '업로드된 사진 URL 배열', required: false })
  @IsArray()
  @IsOptional()
  photos?: string[];
}

