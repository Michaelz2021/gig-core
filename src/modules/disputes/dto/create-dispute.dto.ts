import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsString, IsOptional, IsArray } from 'class-validator';

export class CreateDisputeDto {
  @ApiProperty({ example: 'bk_123' })
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({ example: 'Service not provided' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ required: false, example: 'Provider did not show up' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, example: ['https://example.com/evidence1.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidence?: string[];
}

