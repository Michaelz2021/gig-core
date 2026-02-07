import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsEnum, IsOptional, IsArray, MinLength, Matches, ArrayMaxSize, IsUUID } from 'class-validator';

export enum RegisterRole {
  CONSUMER = 'consumer',
  PROVIDER = 'provider',
  BOTH = 'both',
}

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email (unique, required)',
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '+639123456789',
    description: 'Philippine phone (unique, required). Format: +639XXXXXXXXX, 09XXXXXXXXX, or 9XXXXXXXXX',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' })
  phone: string;

  @ApiProperty({
    example: 'John',
    description: 'First name (required)',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name (required)',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: 'consumer',
    enum: RegisterRole,
    enumName: 'RegisterRole',
    default: RegisterRole.CONSUMER,
    description: 'User role / account type (optional, default: consumer)',
    required: false,
  })
  @IsEnum(RegisterRole, { message: 'role must be one of: consumer, provider, both' })
  @IsOptional()
  role?: RegisterRole;

  @ApiProperty({
    example: 'password123',
    description: 'Password (min 8 chars, required)',
    minLength: 8,
    required: true,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: ['ebba8380-7e3f-4632-b232-8a118712aeb9', '6bf6b204-c920-42ea-af1f-ffea72819f11'],
    description: 'Service category ID array (max 3, optional). Only active category IDs from service_categories. Duplicates are removed.',
    required: false,
    type: [String],
    maxItems: 3,
    items: {
      type: 'string',
      format: 'uuid',
    },
  })
  @IsArray()
  @ArrayMaxSize(3, { message: 'At most 3 service categories can be selected.' })
  @IsUUID('4', { each: true, message: 'Each service category ID must be a valid UUID.' })
  @IsOptional()
  serviceCategoryIds?: string[];
}
