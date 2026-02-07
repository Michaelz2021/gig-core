import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsObject } from 'class-validator';

export class CreateServiceCategoryDto {
  @ApiProperty({ description: 'Category name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'URL slug', required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ description: 'Category description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Icon URL', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ description: 'Parent category ID', required: false })
  @IsString()
  @IsOptional()
  parentCategoryId?: string;

  @ApiProperty({ description: 'Active status', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Display order', default: 0 })
  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @ApiProperty({ description: 'Metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

