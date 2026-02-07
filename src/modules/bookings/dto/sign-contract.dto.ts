import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SignContractDto {
  @ApiProperty({ description: 'Electronic signature (base64)' })
  @IsString()
  signature: string;
}

