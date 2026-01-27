import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsObject } from 'class-validator';

export class CreateServiceCategoryDto {
  @ApiProperty({ description: '카테고리 이름' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'URL 슬러그', required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ description: '카테고리 설명', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '아이콘 URL', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ description: '부모 카테고리 ID', required: false })
  @IsString()
  @IsOptional()
  parentCategoryId?: string;

  @ApiProperty({ description: '활성화 여부', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: '표시 순서', default: 0 })
  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @ApiProperty({ description: '메타데이터', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

