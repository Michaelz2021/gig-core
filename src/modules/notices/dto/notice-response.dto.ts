import { ApiProperty } from '@nestjs/swagger';
import { NoticeType } from '../entities/notice.entity';

export class NoticeResponseDto {
  @ApiProperty({ example: 'notice-123', description: 'Notice ID' })
  id: string;

  @ApiProperty({ 
    enum: NoticeType, 
    example: NoticeType.NOTICE,
    description: 'Notice type' 
  })
  type: NoticeType;

  @ApiProperty({ example: '서비스 점검 안내', description: 'Notice title' })
  title: string;

  @ApiProperty({ 
    example: '안녕하세요. 시스템 점검으로 인해 일시적으로 서비스가 중단됩니다...', 
    description: 'Notice content' 
  })
  content: string;

  @ApiProperty({ 
    example: '2025년 1월 15일 시스템 점검 안내', 
    required: false,
    description: 'Notice summary' 
  })
  summary?: string;

  @ApiProperty({ 
    example: ['https://example.com/image1.jpg'], 
    required: false,
    type: [String],
    description: 'Image URLs array' 
  })
  images?: string[];

  @ApiProperty({ example: true, description: 'Is active' })
  isActive: boolean;

  @ApiProperty({ example: 100, description: 'View count' })
  viewCount: number;

  @ApiProperty({ example: 'admin-123', required: false, description: 'Created by (admin ID)' })
  createdBy?: string;

  @ApiProperty({ 
    example: '2025-01-15T10:00:00Z', 
    required: false,
    description: 'Published date' 
  })
  publishedAt?: Date;

  @ApiProperty({ example: '2025-01-15T09:00:00Z', description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-15T09:00:00Z', description: 'Updated at' })
  updatedAt: Date;
}
