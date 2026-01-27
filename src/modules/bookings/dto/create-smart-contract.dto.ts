import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsUUID } from 'class-validator';

export class CreateSmartContractDto {
  @ApiProperty({ description: '예약 ID' })
  @IsUUID()
  bookingId: string;

  @ApiProperty({ description: '계약 조건', required: false })
  @IsObject()
  @IsOptional()
  contractTerms?: {
    scopeOfWork?: string;
    deliverables?: string[];
    timeline?: Record<string, any>;
    paymentTerms?: Record<string, any>;
    penalties?: Record<string, any>;
    terminationConditions?: Record<string, any>;
  };

  @ApiProperty({ description: '계약서 PDF URL', required: false })
  @IsString()
  @IsOptional()
  contractDocumentUrl?: string;
}

