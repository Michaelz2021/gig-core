import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsObject, IsOptional, Min, Max } from 'class-validator';

export class UpdateTrustScoreDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Transaction ID', required: false })
  @IsString()
  @IsOptional()
  transactionId?: string;

  @ApiProperty({ description: 'Rating (1-5)', required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({ description: 'Feedback', required: false })
  @IsString()
  @IsOptional()
  feedback?: string;

  @ApiProperty({ description: 'Category ratings', required: false })
  @IsObject()
  @IsOptional()
  categories?: {
    communication?: number;
    quality?: number;
    reliability?: number;
    punctuality?: number;
  };
}

