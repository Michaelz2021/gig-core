import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsObject, IsOptional, IsIn, Min, Max } from 'class-validator';

export class KycCompleteDetailsDto {
  @ApiPropertyOptional({ example: 98.2, description: 'Face match score' })
  @IsOptional()
  @IsNumber()
  face_match_score?: number;

  @ApiPropertyOptional({ example: true, description: 'Liveness check passed' })
  @IsOptional()
  liveness_check_passed?: boolean;

  @ApiPropertyOptional({ example: 'philsys_qr', description: 'Extraction method' })
  @IsOptional()
  @IsString()
  extraction_method?: string;
}

export class KycCompleteDto {
  @ApiProperty({
    example: 'approved',
    description: 'KYC result: approved → users.is_id_verified=true, otherwise false',
    enum: ['approved', 'rejected', 'pending'],
  })
  @IsString()
  @IsIn(['approved', 'rejected', 'pending'])
  result: string;

  @ApiProperty({
    example: 'national_id',
    description: 'ID type → providers.government_id_type',
  })
  @IsString()
  id_type: string;

  @ApiProperty({
    example: 'req-abc123',
    description: 'Verification request ID → providers.government_id_number',
  })
  @IsString()
  verification_service_request_id: string;

  @ApiPropertyOptional({
    example: 96.5,
    description: 'AI confidence score (0-100) → users.ai_confidence_score',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  ai_confidence_score?: number;

  @ApiProperty({
    example: 1,
    description: 'KYC level granted (1=BASIC, 2=INTERMEDIATE, 3=ADVANCED) → users.kyc_level',
  })
  @IsNumber()
  @Min(1)
  @Max(3)
  kyc_level_granted: number;

  @ApiPropertyOptional({
    example: '2025-03-11T12:00:00Z',
    description: 'When KYC was completed',
  })
  @IsOptional()
  @IsString()
  completed_at?: string;

  @ApiPropertyOptional({
    type: KycCompleteDetailsDto,
    example: {
      face_match_score: 98.2,
      liveness_check_passed: true,
      extraction_method: 'philsys_qr',
    },
    description: 'Details → users.kyc_detail',
  })
  @IsOptional()
  @IsObject()
  details?: KycCompleteDetailsDto;
}
