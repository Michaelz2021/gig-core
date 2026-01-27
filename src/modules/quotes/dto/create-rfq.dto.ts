import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsDateString, IsOptional, Min, Max } from 'class-validator';

export class CreateRfqDto {
  @ApiProperty({ description: 'Service type' })
  @IsString()
  serviceType: string;

  @ApiProperty({ description: 'Title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Minimum budget', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  budgetMin?: number;

  @ApiProperty({ description: 'Maximum budget', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  budgetMax?: number;

  @ApiProperty({ description: 'Timeline', required: false })
  @IsString()
  @IsOptional()
  timeline?: string;

  @ApiProperty({ description: 'Preferred schedule', required: false })
  @IsDateString()
  @IsOptional()
  preferredSchedule?: string;

  @ApiProperty({ description: 'Requirements', required: false, type: [String] })
  @IsArray()
  @IsOptional()
  requirements?: string[];

  @ApiProperty({ description: 'Service location', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Photo URLs', required: false, type: [String] })
  @IsArray()
  @IsOptional()
  photos?: string[];

  @ApiProperty({ description: 'Document URLs', required: false, type: [String] })
  @IsArray()
  @IsOptional()
  documents?: string[];

  @ApiProperty({ description: 'Deadline', required: false })
  @IsDateString()
  @IsOptional()
  deadline?: string;
}

