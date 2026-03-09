import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateVariantDto {
  @ApiPropertyOptional({ example: '60 min Classic' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Full-body Swedish massage' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 800 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
