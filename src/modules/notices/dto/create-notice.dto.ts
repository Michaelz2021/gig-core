import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsString, IsOptional, IsArray, IsBoolean, IsDateString } from 'class-validator';
import { NoticeType } from '../entities/notice.entity';

export class CreateNoticeDto {
  @ApiProperty({ 
    enum: NoticeType, 
    example: NoticeType.NOTICE,
    description: 'Notice type (notice or news)' 
  })
  @IsEnum(NoticeType)
  @IsNotEmpty()
  type: NoticeType;

  @ApiProperty({ example: '서비스 점검 안내', description: 'Notice title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ 
    example: '안녕하세요. 시스템 점검으로 인해 일시적으로 서비스가 중단됩니다...', 
    description: 'Notice content' 
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ 
    example: '2025년 1월 15일 시스템 점검 안내', 
    required: false,
    description: 'Notice summary (optional)' 
  })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiProperty({ 
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'], 
    required: false,
    type: [String],
    description: 'Image URLs array (optional)' 
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ example: true, required: false, description: 'Is active (default: true)' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ 
    example: '2025-01-15T10:00:00Z', 
    required: false,
    description: 'Published date (optional)' 
  })
  @IsDateString()
  @IsOptional()
  publishedAt?: Date;
}
