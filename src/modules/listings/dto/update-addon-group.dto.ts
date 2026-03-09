import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsBoolean, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAddonItemDto {
  @ApiProperty({ example: 'Lavender' })
  @IsString()
  label: string;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  extraPrice: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;
}

export class UpdateAddonGroupDto {
  @ApiPropertyOptional({ example: 'Aromatherapy Oil' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isMultiple?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;

  @ApiPropertyOptional({
    type: [UpdateAddonItemDto],
    description: '그룹 하위 아이템 목록. 전달 시 기존 아이템 삭제 후 이 목록으로 교체.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAddonItemDto)
  items?: UpdateAddonItemDto[];
}
