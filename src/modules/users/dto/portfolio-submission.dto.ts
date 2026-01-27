import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class PortfolioSubmissionDto {
  @ApiProperty({
    description: 'Portfolio Title',
    example: 'My Professional Portfolio',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Portfolio Description',
    example: 'This portfolio showcases my best work and achievements.',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

