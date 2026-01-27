import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsDateString, IsNumber, Min, IsOptional, IsObject, IsString } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'svc_123' })
  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ example: '2025-11-15T10:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  scheduledDate: string;

  @ApiProperty({ example: 500.0 })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty({ required: false, example: 'Please arrive on time' })
  @IsOptional()
  @IsNotEmpty()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  address?: {
    street?: string;
    city?: string;
    province?: string;
    zipCode?: string;
  };

  @ApiProperty({ required: false, example: '서비스 작업 내용 (계약서에서 명문화될 수 있는 경우)' })
  @IsOptional()
  @IsString()
  task?: string;
}

