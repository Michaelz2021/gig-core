import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { AppMode, DevicePlatform } from '../entities/user-device-token.entity';

export class RegisterDeviceTokenDto {
  @ApiProperty({
    description: 'FCM device token',
    example: 'fGhJkLmNoPqRsTuVwXyZ1234567890abcdefghijklmnopqrstuvwxyz',
  })
  @IsString()
  @IsNotEmpty()
  deviceToken: string;

  @ApiProperty({
    description: 'App mode (consumer or provider)',
    enum: AppMode,
    example: AppMode.CONSUMER,
  })
  @IsEnum(AppMode)
  @IsNotEmpty()
  appMode: AppMode;

  @ApiProperty({
    description: 'Device platform',
    enum: DevicePlatform,
    example: DevicePlatform.ANDROID,
  })
  @IsEnum(DevicePlatform)
  @IsNotEmpty()
  platform: DevicePlatform;

  @ApiProperty({
    description: 'Device ID (optional)',
    example: 'device-12345',
    required: false,
  })
  @IsString()
  @IsOptional()
  deviceId?: string;
}

