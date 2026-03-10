import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class LoginDto {
  /** Email (required for email login). Omit when login-type is "phone". */
  @ApiPropertyOptional({ example: 'test@example.com', description: 'Required for email login' })
  @IsOptional()
  @ValidateIf((o) => o.email != null && o.email !== '')
  @IsEmail({}, { message: 'email must be a valid email' })
  email?: string;

  @ApiProperty({ example: 'Test1234!' })
  @IsString()
  @IsNotEmpty()
  password: string;

  /** App context: consumer | provider (camelCase) */
  @ApiPropertyOptional({ example: 'consumer', description: 'App context: consumer | provider' })
  @IsOptional()
  @IsString()
  userType?: string;

  /** login-type: email | phone. When "phone", login by phone number. */
  @ApiPropertyOptional({ example: 'phone', description: 'Use "phone" for phone-number login' })
  @IsOptional()
  @IsString()
  'login-type'?: string;

  /** App context (kebab-case). Swagger/API examples use this. */
  @ApiPropertyOptional({ example: 'consumer', description: 'App context: consumer | provider' })
  @IsOptional()
  @IsString()
  'user-type'?: string;

  @ApiPropertyOptional({ example: '+639123456789', description: 'Required for phone login (login-type: phone)' })
  @ValidateIf((o) => o['login-type'] === 'phone' || !o.email)
  @IsOptional()
  @IsString()
  phone?: string;
}

