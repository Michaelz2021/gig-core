import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDateString, IsArray, IsBoolean, Min, Max } from 'class-validator';

export class CreateAuctionDto {
  @ApiProperty({ description: 'Service category ID' })
  @IsString()
  @IsOptional()
  serviceCategoryId?: string;

  @ApiProperty({ description: 'Service title' })
  @IsString()
  serviceTitle: string;

  @ApiProperty({ description: 'Service description' })
  @IsString()
  serviceDescription: string;

  @ApiProperty({ description: 'Service requirements', required: false })
  @IsString()
  @IsOptional()
  serviceRequirements?: string;

  @ApiProperty({ description: 'Service location' })
  @IsString()
  serviceLocation: string;

  @ApiProperty({ description: 'Latitude', required: false })
  @IsNumber()
  @IsOptional()
  locationLatitude?: number;

  @ApiProperty({ description: 'Longitude', required: false })
  @IsNumber()
  @IsOptional()
  locationLongitude?: number;

  @ApiProperty({ description: 'Preferred date', required: false })
  @IsDateString()
  @IsOptional()
  preferredDate?: string;

  @ApiProperty({ description: 'Preferred time', required: false })
  @IsString()
  @IsOptional()
  preferredTime?: string;

  @ApiProperty({ description: 'Bid deadline', required: false })
  @IsDateString()
  @IsOptional()
  deadline?: string;

  @ApiProperty({ description: 'Minimum budget', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  budgetMin?: number;

  @ApiProperty({ description: 'Maximum budget', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  budgetMax?: number;

  @ApiProperty({ description: 'Photo URL array', required: false })
  @IsArray()
  @IsOptional()
  photos?: string[];

  @ApiProperty({ description: 'Document URL array', required: false })
  @IsArray()
  @IsOptional()
  documents?: string[];

  @ApiProperty({ description: 'Auto-select enabled', default: false })
  @IsBoolean()
  @IsOptional()
  autoSelectEnabled?: boolean;

  @ApiProperty({ description: 'Max bids to receive', required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  maxBidsToReceive?: number;
}

