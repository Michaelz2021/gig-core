import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  @ApiProperty({ 
    example: 'refresh_token_here',
    required: false,
    description: 'Optional refresh token to revoke'
  })
  @IsString()
  @IsOptional()
  refreshToken?: string;
}

