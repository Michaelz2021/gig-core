import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SignContractDto {
  @ApiProperty({ description: '전자서명 (base64)' })
  @IsString()
  signature: string;
}

