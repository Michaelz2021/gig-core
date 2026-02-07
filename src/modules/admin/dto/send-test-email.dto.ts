import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendTestEmailDto {
  @ApiProperty({
    example: 'michael2geron@gmail.com',
    description: '수신 이메일 주소',
    required: true,
  })
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해 주세요.' })
  @IsNotEmpty({ message: '이메일 주소는 필수입니다.' })
  email: string;
}
