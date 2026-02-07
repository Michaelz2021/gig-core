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

  @ApiProperty({ example: 'Service maintenance notice', description: 'Notice title' })
  title: string;

  @ApiProperty({ 
    example: 'Service will be temporarily unavailable due to system maintenance...', 
    description: 'Notice content' 
  })
  content: string;

  @ApiProperty({ 
    example: 'System maintenance notice - Jan 15, 2025', 
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
