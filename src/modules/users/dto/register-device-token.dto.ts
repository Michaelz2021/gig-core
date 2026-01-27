import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { AppMode, DevicePlatform } from '../entities/user-device-token.entity';

export class RegisterDeviceTokenDto {
  @ApiProperty({
    description: 'FCM 디바이스 토큰',
    example: 'fGhJkLmNoPqRsTuVwXyZ1234567890abcdefghijklmnopqrstuvwxyz',
  })
  @IsString()
  @IsNotEmpty()
  deviceToken: string;

  @ApiProperty({
    description: '앱 모드 (consumer 또는 provider)',
    enum: AppMode,
    example: AppMode.CONSUMER,
  })
  @IsEnum(AppMode)
  @IsNotEmpty()
  appMode: AppMode;

  @ApiProperty({
    description: '디바이스 플랫폼',
    enum: DevicePlatform,
    example: DevicePlatform.ANDROID,
  })
  @IsEnum(DevicePlatform)
  @IsNotEmpty()
  platform: DevicePlatform;

  @ApiProperty({
    description: '디바이스 ID (선택사항)',
    example: 'device-12345',
    required: false,
  })
  @IsString()
  @IsOptional()
  deviceId?: string;
}

