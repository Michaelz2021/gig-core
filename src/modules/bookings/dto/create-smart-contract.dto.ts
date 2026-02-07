import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsUUID } from 'class-validator';

export class CreateSmartContractDto {
  @ApiProperty({ description: 'Booking ID' })
  @IsUUID()
  bookingId: string;

  @ApiProperty({ description: 'Contract terms', required: false })
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

  @ApiProperty({ description: 'Contract PDF URL', required: false })
  @IsString()
  @IsOptional()
  contractDocumentUrl?: string;
}

