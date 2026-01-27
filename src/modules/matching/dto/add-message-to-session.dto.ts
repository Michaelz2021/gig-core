import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class AddMessageToSessionDto {
  @ApiProperty({ description: '메시지 내용' })
  @IsString()
  message: string;

  @ApiProperty({ description: '메시지 메타데이터', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

