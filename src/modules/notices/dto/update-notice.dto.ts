import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsArray, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { NoticeType } from '../entities/notice.entity';

export class UpdateNoticeDto {
  @ApiProperty({ enum: NoticeType, required: false })
  @IsEnum(NoticeType)
  @IsOptional()
  type?: NoticeType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  publishedAt?: Date;
}
