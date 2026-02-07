import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendTestOtpDto {
  @ApiProperty({
    example: '+639123456789',
    description: 'Target Philippine mobile number. Format: +639XXXXXXXXX, 09XXXXXXXXX, or 9XXXXXXXXX',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

