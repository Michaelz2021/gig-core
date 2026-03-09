import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'test@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Test1234!' })
  @IsString()
  @IsNotEmpty()
  password: string;

  /** App context: consumer | provider (camelCase) */
  @ApiPropertyOptional({ example: 'consumer', description: 'App context: consumer | provider' })
  @IsOptional()
  @IsString()
  userType?: string;

  /** App context (kebab-case, same as user-type). Accepted for mobile/client compatibility. */
  @ApiPropertyOptional({ example: 'consumer', description: 'App context (alias of user-type)' })
  @IsOptional()
  @IsString()
  'login-type'?: string;

  /** App context (kebab-case). Swagger/API examples use this. */
  @ApiPropertyOptional({ example: 'consumer', description: 'App context: consumer | provider' })
  @IsOptional()
  @IsString()
  'user-type'?: string;

  @ApiPropertyOptional({ example: '+639992289898', description: 'Phone number (e.g. for provider app)' })
  @IsOptional()
  @IsString()
  phone?: string;
}

