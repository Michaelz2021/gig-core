import { ApiProperty } from '@nestjs/swagger';
import { 
  IsOptional, 
  IsString, 
  IsInt, 
  Min, 
  Max, 
  IsArray, 
  IsDateString,
  ValidateNested,
  IsUrl
} from 'class-validator';
import { Type } from 'class-transformer';

export class PhotoDto {
  @ApiProperty({ example: 'https://example.com/photo.jpg', description: 'Photo URL' })
  @IsUrl()
  url: string;

  @ApiProperty({ required: false, example: 'Before work', description: 'Photo caption' })
  @IsOptional()
  @IsString()
  caption?: string;
}

export class EvidenceDto {
  @ApiProperty({ example: 'image', description: 'Evidence type (image, video, document, etc.)' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'https://example.com/evidence.jpg', description: 'Evidence URL' })
  @IsUrl()
  url: string;

  @ApiProperty({ required: false, example: 'Leak check', description: 'Evidence caption' })
  @IsOptional()
  @IsString()
  caption?: string;
}

export class CreateWorkProgressReportDto {
  // 메시지 필드 (notes, message, content 중 하나는 필수)
  @ApiProperty({ 
    required: false,
    example: 'Started work. First AC unit filter is very dirty.',
    description: 'Work notes (one of notes, message, or content is required)'
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ 
    required: false,
    example: 'First AC unit cleaning completed.',
    description: 'Work message (one of notes, message, or content is required)'
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({ 
    required: false,
    example: 'Second AC unit completed as well.',
    description: 'Work content (one of notes, message, or content is required)'
  })
  @IsOptional()
  @IsString()
  content?: string;

  // 진행률
  @ApiProperty({ 
    required: false,
    example: 50,
    minimum: 0,
    maximum: 100,
    description: 'Progress percentage (0-100)'
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progressPercentage?: number;

  // 완료된 작업 목록
  @ApiProperty({ 
    required: false,
    example: ['Living room cleaning', 'Bathroom cleaning', 'Kitchen cleaning'],
    description: 'Completed tasks list',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  completedTasks?: string[];

  // 사진 (URL 문자열 또는 객체 배열)
  @ApiProperty({ 
    required: false,
    example: [
      'https://example.com/photo1.jpg',
      { url: 'https://example.com/photo2.jpg', caption: 'Before work' }
    ],
    description: 'Work photos (URL strings or object array)',
    type: [Object]
  })
  @IsOptional()
  @IsArray()
  photos?: (string | PhotoDto)[];

  // 증거 자료
  @ApiProperty({ 
    required: false,
    example: [
      { type: 'image', url: 'https://example.com/evidence1.jpg', caption: 'Leak check' },
      { type: 'video', url: 'https://example.com/evidence2.mp4', caption: 'Work in progress' }
    ],
    description: 'Evidence',
    type: [EvidenceDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvidenceDto)
  evidence?: EvidenceDto[];

  // 다음 단계
  @ApiProperty({ 
    required: false,
    example: ['Final tasks', 'Final check', 'Cleaning'],
    description: 'Next steps list',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  nextSteps?: string[];

  // 예상 완료 시간
  @ApiProperty({ 
    required: false,
    example: '2025-01-15T18:00:00Z',
    description: 'Estimated completion (ISO 8601)'
  })
  @IsOptional()
  @IsDateString()
  estimatedCompletion?: string;

  // 보고 시간 (선택적, 없으면 현재 시간 사용)
  @ApiProperty({ 
    required: false,
    example: '2025-01-15T10:30:00Z',
    description: 'Reported at (ISO 8601, optional)'
  })
  @IsOptional()
  @IsDateString()
  reportedAt?: string;
}

