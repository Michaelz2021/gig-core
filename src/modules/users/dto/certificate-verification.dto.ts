import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum CertificateType {
  TESDA = 'TESDA',
  PRC = 'PRC',
  CSC = 'CSC',
  OTHER = 'Other',
}

export class CertificateVerificationDto {
  @ApiProperty({
    description: 'Certificate Type',
    enum: CertificateType,
    example: 'TESDA',
  })
  @IsEnum(CertificateType)
  certificateType: CertificateType;

  @ApiProperty({
    description: 'Issuing Authority',
    example: 'TESDA',
  })
  @IsString()
  issuingAuthority: string;

  @ApiProperty({
    description: 'Certificate Number',
    example: '123456789',
  })
  @IsString()
  @IsOptional()
  certificateNumber?: string;
}
