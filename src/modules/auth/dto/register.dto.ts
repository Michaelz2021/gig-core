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
    description: '사용자 이메일 주소 (고유값, 필수)',
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '+639123456789',
    description: '필리핀 전화번호 (고유값, 필수). 형식: +639XXXXXXXXX, 09XXXXXXXXX, 또는 9XXXXXXXXX',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' })
  phone: string;

  @ApiProperty({
    example: 'John',
    description: '이름 (필수)',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: '성 (필수)',
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
    description: '사용자 역할 / 계정 타입 (선택적, 기본값: consumer)',
    required: false,
  })
  @IsEnum(RegisterRole, { message: 'role must be one of: consumer, provider, both' })
  @IsOptional()
  role?: RegisterRole;

  @ApiProperty({
    example: 'password123',
    description: '비밀번호 (최소 8자, 필수)',
    minLength: 8,
    required: true,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: ['ebba8380-7e3f-4632-b232-8a118712aeb9', '6bf6b204-c920-42ea-af1f-ffea72819f11'],
    description: '전문 분야 서비스 카테고리 ID 배열 (최대 3개, 선택적). service_categories 테이블의 활성화된 카테고리 ID만 사용 가능. 중복된 ID는 자동으로 제거됨',
    required: false,
    type: [String],
    maxItems: 3,
    items: {
      type: 'string',
      format: 'uuid',
    },
  })
  @IsArray()
  @ArrayMaxSize(3, { message: '최대 3개의 서비스 카테고리만 선택할 수 있습니다.' })
  @IsUUID('4', { each: true, message: '각 서비스 카테고리 ID는 유효한 UUID 형식이어야 합니다.' })
  @IsOptional()
  serviceCategoryIds?: string[];
}
