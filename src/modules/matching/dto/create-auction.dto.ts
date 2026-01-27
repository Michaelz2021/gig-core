import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDateString, IsArray, IsBoolean, Min, Max } from 'class-validator';

export class CreateAuctionDto {
  @ApiProperty({ description: '서비스 카테고리 ID' })
  @IsString()
  @IsOptional()
  serviceCategoryId?: string;

  @ApiProperty({ description: '서비스 제목' })
  @IsString()
  serviceTitle: string;

  @ApiProperty({ description: '서비스 상세 설명' })
  @IsString()
  serviceDescription: string;

  @ApiProperty({ description: '서비스 요구사항', required: false })
  @IsString()
  @IsOptional()
  serviceRequirements?: string;

  @ApiProperty({ description: '서비스 위치' })
  @IsString()
  serviceLocation: string;

  @ApiProperty({ description: '위도', required: false })
  @IsNumber()
  @IsOptional()
  locationLatitude?: number;

  @ApiProperty({ description: '경도', required: false })
  @IsNumber()
  @IsOptional()
  locationLongitude?: number;

  @ApiProperty({ description: '희망 날짜', required: false })
  @IsDateString()
  @IsOptional()
  preferredDate?: string;

  @ApiProperty({ description: '희망 시간', required: false })
  @IsString()
  @IsOptional()
  preferredTime?: string;

  @ApiProperty({ description: '입찰 마감 시간', required: false })
  @IsDateString()
  @IsOptional()
  deadline?: string;

  @ApiProperty({ description: '최소 예산', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  budgetMin?: number;

  @ApiProperty({ description: '최대 예산', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  budgetMax?: number;

  @ApiProperty({ description: '사진 URL 배열', required: false })
  @IsArray()
  @IsOptional()
  photos?: string[];

  @ApiProperty({ description: '문서 URL 배열', required: false })
  @IsArray()
  @IsOptional()
  documents?: string[];

  @ApiProperty({ description: '자동 선택 활성화 여부', default: false })
  @IsBoolean()
  @IsOptional()
  autoSelectEnabled?: boolean;

  @ApiProperty({ description: '최대 수령 입찰 수', required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  maxBidsToReceive?: number;
}

