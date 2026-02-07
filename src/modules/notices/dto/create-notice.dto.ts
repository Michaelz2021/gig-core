import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsString, IsOptional, IsArray, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
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

  @ApiProperty({ example: 'Service maintenance notice', description: 'Notice title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ 
    example: 'Service will be temporarily unavailable due to system maintenance...', 
    description: 'Notice content' 
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ 
    example: 'System maintenance notice - Jan 15, 2025', 
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
    description: 'Published date (optional, ISO 8601 string)' 
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  publishedAt?: Date;
}
