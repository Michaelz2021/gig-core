import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsString, MinLength, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdatePasswordDto {
  @ApiProperty({
    example: 'email',
    enum: ['email', 'phone'],
    description: '비밀번호 변경 대상 식별 타입. 앱은 otp-type (kebab-case)으로 보낼 수 있음.',
  })
  @Transform(({ value, obj }) => value ?? obj?.['otp-type'] ?? undefined)
  @IsString()
  @IsNotEmpty()
  @IsIn(['email', 'phone'], { message: 'otpType must be email or phone' })
  otpType: 'email' | 'phone';

  @ApiProperty({
    example: 'test@example.com',
    required: false,
    description: 'otpType이 email일 때 필수',
  })
  @ValidateIf((o) => o.otpType === 'email')
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @ApiProperty({
    example: '+639123456789',
    required: false,
    description: 'otpType이 phone일 때 필수',
  })
  @ValidateIf((o) => o.otpType === 'phone')
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @ApiProperty({
    example: 'NewPassword123!',
    description: '새 비밀번호 (최소 8자)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
