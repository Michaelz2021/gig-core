import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Length, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class ForgotOtpDto {
  @ApiProperty({
    example: 'email',
    enum: ['email', 'phone'],
    description: 'OTP send type (email or phone). App may send as otp-type (kebab-case).',
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
  @ValidateIf((o) => o.otpType === 'email' && !o.otp)
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @ApiProperty({
    example: '+639123456789',
    required: false,
    description: 'otpType이 phone일 때 필수',
  })
  @ValidateIf((o) => o.otpType === 'phone' && !o.otp)
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @ApiProperty({
    example: '274479',
    required: false,
    description: 'OTP 검증 시 사용합니다. 값이 있으면 발송이 아니라 검증 모드로 동작합니다.',
  })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  otp?: string;
}
