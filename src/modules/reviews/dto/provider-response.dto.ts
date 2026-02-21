import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ProviderResponseDto {
  @ApiProperty({
    example: 'Thank you for your feedback!',
    description: '제공자가 남기는 리뷰 답글',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  providerResponse: string;
}
