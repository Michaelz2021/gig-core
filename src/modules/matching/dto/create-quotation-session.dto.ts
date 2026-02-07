import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDateString, IsArray, Min, Max } from 'class-validator';

export class CreateQuotationSessionDto {
  @ApiProperty({ description: 'Service category', required: false })
  @IsString()
  @IsOptional()
  serviceCategory?: string;

  @ApiProperty({ description: 'Service description', required: false })
  @IsString()
  @IsOptional()
  serviceDescription?: string;

  @ApiProperty({ description: 'Service location', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Preferred date', required: false })
  @IsDateString()
  @IsOptional()
  preferredDate?: string;

  @ApiProperty({ description: 'Preferred time', required: false })
  @IsString()
  @IsOptional()
  preferredTime?: string;

  @ApiProperty({ description: 'Minimum budget', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  budgetRangeMin?: number;

  @ApiProperty({ description: 'Maximum budget', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  budgetRangeMax?: number;

  @ApiProperty({ description: '특별 요구사항', required: false })
  @IsString()
  @IsOptional()
  specialRequirements?: string;

  @ApiProperty({ description: 'Uploaded photo URL array', required: false })
  @IsArray()
  @IsOptional()
  photos?: string[];
}

