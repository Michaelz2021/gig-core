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
  @ApiProperty({ example: 'https://example.com/photo.jpg', description: '사진 URL' })
  @IsUrl()
  url: string;

  @ApiProperty({ required: false, example: '작업 전 상태', description: '사진 설명' })
  @IsOptional()
  @IsString()
  caption?: string;
}

export class EvidenceDto {
  @ApiProperty({ example: 'image', description: '증거 자료 타입 (image, video, document 등)' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'https://example.com/evidence.jpg', description: '증거 자료 URL' })
  @IsUrl()
  url: string;

  @ApiProperty({ required: false, example: '누수 확인', description: '증거 자료 설명' })
  @IsOptional()
  @IsString()
  caption?: string;
}

export class CreateWorkProgressReportDto {
  // 메시지 필드 (notes, message, content 중 하나는 필수)
  @ApiProperty({ 
    required: false,
    example: '작업을 시작했습니다. 첫 번째 AC 유닛의 필터를 확인한 결과 매우 더러운 상태입니다.',
    description: '작업 노트 (notes, message, 또는 content 중 하나는 필수입니다)'
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ 
    required: false,
    example: '첫 번째 AC 유닛 청소 완료했습니다.',
    description: '작업 메시지 (notes, message, 또는 content 중 하나는 필수입니다)'
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({ 
    required: false,
    example: '두 번째 AC 유닛도 완료했습니다.',
    description: '작업 내용 (notes, message, 또는 content 중 하나는 필수입니다)'
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
    description: '작업 진행률 (0-100)'
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progressPercentage?: number;

  // 완료된 작업 목록
  @ApiProperty({ 
    required: false,
    example: ['거실 청소', '화장실 청소', '주방 청소'],
    description: '완료된 작업 목록',
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
      { url: 'https://example.com/photo2.jpg', caption: '작업 전 상태' }
    ],
    description: '작업 사진 (URL 문자열 또는 객체 배열)',
    type: [Object]
  })
  @IsOptional()
  @IsArray()
  photos?: (string | PhotoDto)[];

  // 증거 자료
  @ApiProperty({ 
    required: false,
    example: [
      { type: 'image', url: 'https://example.com/evidence1.jpg', caption: '누수 확인' },
      { type: 'video', url: 'https://example.com/evidence2.mp4', caption: '작업 과정' }
    ],
    description: '증거 자료',
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
    example: ['마무리 작업', '최종 점검', '청소'],
    description: '다음 단계 작업 목록',
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
    description: '예상 완료 시간 (ISO 8601 형식)'
  })
  @IsOptional()
  @IsDateString()
  estimatedCompletion?: string;

  // 보고 시간 (선택적, 없으면 현재 시간 사용)
  @ApiProperty({ 
    required: false,
    example: '2025-01-15T10:30:00Z',
    description: '보고 시간 (ISO 8601 형식, 선택적)'
  })
  @IsOptional()
  @IsDateString()
  reportedAt?: string;
}

