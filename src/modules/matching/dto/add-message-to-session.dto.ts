import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class AddMessageToSessionDto {
  @ApiProperty({ description: 'Message content' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Message metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

