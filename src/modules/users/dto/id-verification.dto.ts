import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum IdType {
  NATIONAL_ID = 'National ID',
  PASSPORT = 'Passport',
  DRIVER_LICENSE = 'Driver License',
  VOTER_ID = 'Voter ID',
  OTHER = 'Other',
}

export class IdVerificationDto {
  @ApiProperty({
    description: 'ID Type',
    enum: IdType,
    example: 'National ID',
  })
  @IsEnum(IdType)
  idType: IdType;

  @ApiProperty({
    description: 'ID Number (optional)',
    required: false,
    example: '123456789',
  })
  @IsString()
  @IsOptional()
  idNumber?: string;
}
