import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReviewRatingsDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  quality: number;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  communication: number;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  punctuality: number;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  professionalism: number;
}

export class CreateReviewDto {
  @ApiProperty({ example: '55d7133a-7df4-4c8e-8226-f75c6887c854' })
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  overallRating: number;

  @ApiProperty({ type: ReviewRatingsDto })
  @ValidateNested()
  @Type(() => ReviewRatingsDto)
  @IsNotEmpty()
  ratings: ReviewRatingsDto;

  @ApiProperty({ required: false, example: 'Great service!' })
  @IsOptional()
  @IsString()
  reviewText?: string;

  @ApiProperty({
    required: false,
    type: [String],
    example: [],
    description: '리뷰 이미지 URI 배열',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUris?: string[];
}

