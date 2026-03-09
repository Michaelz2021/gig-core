import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsBoolean, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AddonItemDto {
  @ApiProperty({ example: 'Lavender' })
  @IsString()
  label: string;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  extraPrice: number;

  @ApiPropertyOptional({ example: 1, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}

export class AddonGroupItemDto {
  @ApiProperty({ example: 'Aromatherapy Oil' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  isMultiple?: boolean;

  @ApiPropertyOptional({ example: 1, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: true, description: '앱에서 전달 시 허용. DB service_addon_groups에는 미반영' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ type: [AddonItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddonItemDto)
  items: AddonItemDto[];
}

export class CreateAddonGroupsDto {
  @ApiProperty({ type: [AddonGroupItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddonGroupItemDto)
  addonGroups: AddonGroupItemDto[];
}
