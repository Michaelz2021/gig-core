import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryListingsDto {
  @ApiPropertyOptional({ description: 'Filter by category UUID' })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional({ description: 'Filter by area (e.g. city name)' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ description: 'Minimum price (PHP)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  min_price?: number;

  @ApiPropertyOptional({ description: 'Maximum price (PHP)' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  max_price?: number;

  @ApiPropertyOptional({ description: 'Filter by instant book' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_instant_book?: boolean;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 20;
}
