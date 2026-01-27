import { ApiProperty } from '@nestjs/swagger';

export class WorkProgressReportResponseDto {
  @ApiProperty({ example: 'rpt_001', description: 'Report ID' })
  id: string;

  @ApiProperty({ example: 'bkg_123', description: 'Booking ID' })
  bookingId: string;

  @ApiProperty({ example: 'progress', enum: ['progress'], description: 'Report type' })
  reportType: string;

  @ApiProperty({ 
    example: '작업을 시작했습니다. 첫 번째 AC 유닛의 필터를 확인한 결과 매우 더러운 상태입니다.', 
    required: false,
    description: 'Report notes (one of notes, message, or content is required)' 
  })
  notes?: string;

  @ApiProperty({ 
    example: '첫 번째 AC 유닛 청소 완료했습니다.', 
    required: false,
    description: 'Report message (one of notes, message, or content is required)' 
  })
  message?: string;

  @ApiProperty({ 
    example: '두 번째 AC 유닛도 완료했습니다.', 
    required: false,
    description: 'Report content (one of notes, message, or content is required)' 
  })
  content?: string;

  @ApiProperty({ 
    example: '2025-01-15T09:15:00Z', 
    description: 'Created timestamp (one of createdAt, reportedAt, or timestamp is required)' 
  })
  createdAt: Date;

  @ApiProperty({ 
    example: '2025-01-15T10:30:00Z', 
    required: false,
    description: 'Reported timestamp (one of createdAt, reportedAt, or timestamp is required)' 
  })
  reportedAt?: Date;

  @ApiProperty({ 
    example: '2025-01-15T11:45:00Z', 
    required: false,
    description: 'Timestamp (one of createdAt, reportedAt, or timestamp is required)' 
  })
  timestamp?: Date;

  @ApiProperty({ 
    example: 50, 
    required: false,
    minimum: 0,
    maximum: 100,
    description: 'Progress percentage (0-100)' 
  })
  progressPercentage?: number;

  @ApiProperty({ 
    example: ['첫 번째 AC 유닛 검사 완료', '필터 상태 확인 완료'], 
    required: false,
    type: [String],
    description: 'Completed tasks list' 
  })
  completedTasks?: string[];

  @ApiProperty({ 
    example: [
      'https://cdn.example.com/reports/photo1.jpg',
      { url: 'https://cdn.example.com/reports/photo2.jpg', caption: 'After cleaning' }
    ], 
    required: false,
    description: 'Photos array (strings or objects with url and optional caption)' 
  })
  photos?: (string | { url: string; caption?: string })[];

  @ApiProperty({ 
    example: [
      { type: 'photo', url: 'https://cdn.example.com/reports/evidence1.jpg', caption: 'Evidence photo' }
    ], 
    required: false,
    description: 'Evidence array (objects with type, url, and optional caption)' 
  })
  evidence?: { type: string; url: string; caption?: string }[];

  @ApiProperty({ 
    example: ['두 번째 AC 유닛 청소 예정', '최종 점검'], 
    required: false,
    type: [String],
    description: 'Next steps list' 
  })
  nextSteps?: string[];

  @ApiProperty({ 
    example: '2025-01-15T14:00:00Z', 
    required: false,
    description: 'Estimated completion time' 
  })
  estimatedCompletion?: Date;

  @ApiProperty({ example: '2025-01-15T09:15:00Z', description: 'Last updated timestamp' })
  updatedAt: Date;
}

export class WorkProgressReportsResponseDto {
  @ApiProperty({ example: true, description: 'Success status' })
  success: boolean;

  @ApiProperty({ 
    type: [WorkProgressReportResponseDto],
    isArray: true,
    description: 'Array of work progress reports' 
  })
  data: WorkProgressReportResponseDto[];
}

