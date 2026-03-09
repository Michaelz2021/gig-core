import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, IsBoolean, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class VariantItemDto {
  @ApiProperty({ example: '60 min Classic' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Full-body Swedish massage' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 800.0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 60 })
  @IsNumber()
  @Min(1)
  durationMinutes: number;

  @ApiPropertyOptional({ example: 1, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreateVariantsDto {
  @ApiProperty({ type: [VariantItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantItemDto)
  variants: VariantItemDto[];
}
