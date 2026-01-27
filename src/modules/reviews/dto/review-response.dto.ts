import { ApiProperty } from '@nestjs/swagger';
import { ReviewType } from '../entities/review.entity';

export class UserInfoDto {
  @ApiProperty({ example: 'user-123', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'John', required: false })
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  lastName?: string;

  @ApiProperty({ example: 'https://example.com/photo.jpg', required: false })
  profilePhotoUrl?: string;
}

export class ReviewResponseDto {
  @ApiProperty({ example: 'review-123', description: 'Review ID' })
  id: string;

  @ApiProperty({ example: 'booking-123', description: 'Booking ID' })
  bookingId: string;

  @ApiProperty({ example: 'user-456', description: 'Reviewer ID' })
  reviewerId: string;

  @ApiProperty({ type: UserInfoDto, required: false, description: 'Reviewer information' })
  reviewer?: UserInfoDto;

  @ApiProperty({ example: 'user-789', description: 'Reviewee ID' })
  revieweeId: string;

  @ApiProperty({ type: UserInfoDto, required: false, description: 'Reviewee information' })
  reviewee?: UserInfoDto;

  @ApiProperty({ 
    enum: ReviewType, 
    example: ReviewType.CONSUMER_TO_PROVIDER,
    description: 'Review type' 
  })
  reviewType: ReviewType;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5, description: 'Overall rating' })
  rating: number;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5, required: false, description: 'Quality rating' })
  qualityRating?: number;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5, required: false, description: 'Communication rating' })
  communicationRating?: number;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5, required: false, description: 'Punctuality rating' })
  punctualityRating?: number;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5, required: false, description: 'Professionalism rating' })
  professionalismRating?: number;

  @ApiProperty({ example: 'Great service!', required: false, description: 'Review text' })
  reviewText?: string;

  @ApiProperty({ 
    example: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'], 
    required: false,
    type: [String],
    description: 'Review photos' 
  })
  photos?: string[];

  @ApiProperty({ example: 'Thank you for your review!', required: false, description: 'Provider response' })
  responseText?: string;

  @ApiProperty({ example: '2025-01-15T10:30:00Z', required: false, description: 'Response date' })
  responseDate?: Date;

  @ApiProperty({ example: true, description: 'Is verified review' })
  isVerified: boolean;

  @ApiProperty({ example: true, description: 'Is visible' })
  isVisible: boolean;

  @ApiProperty({ example: false, description: 'Is flagged' })
  isFlagged: boolean;

  @ApiProperty({ example: '2025-01-15T09:00:00Z', description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-15T09:00:00Z', description: 'Updated at' })
  updatedAt: Date;
}
