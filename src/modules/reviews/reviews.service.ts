import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review, ReviewType } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ProviderResponseDto } from './dto/provider-response.dto';
import { BookingsService } from '../bookings/bookings.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    private readonly bookingsService: BookingsService,
    private readonly usersService: UsersService,
  ) {}

  async create(reviewerId: string, createReviewDto: CreateReviewDto): Promise<Review> {
    const booking = await this.bookingsService.findOne(createReviewDto.bookingId);

    if (booking.status !== 'completed') {
      throw new BadRequestException('Can only review completed bookings');
    }

    // Check if already reviewed
    const existingReview = await this.reviewRepository
      .createQueryBuilder('review')
      .where('review.bookingId = :bookingId', { bookingId: createReviewDto.bookingId })
      .andWhere('review.reviewerId = :reviewerId', { reviewerId })
      .getOne();

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this booking');
    }

    const isConsumerReviewer = booking.consumerId === reviewerId;
    const providerUserId = booking.provider?.userId;

    if (!isConsumerReviewer) {
      throw new ForbiddenException('Only the consumer can create a review');
    }

    if (!providerUserId) {
      throw new BadRequestException('Provider user mapping not found for this booking');
    }

    const revieweeId = providerUserId;
    const reviewType = ReviewType.CONSUMER;

    const review = this.reviewRepository.create({
      bookingId: createReviewDto.bookingId,
      rating: createReviewDto.overallRating,
      qualityRating: createReviewDto.ratings.quality,
      communicationRating: createReviewDto.ratings.communication,
      punctualityRating: createReviewDto.ratings.punctuality,
      professionalismRating: createReviewDto.ratings.professionalism,
      reviewText: createReviewDto.reviewText,
      photos: createReviewDto.photoUris ?? [],
      reviewerId,
      revieweeId,
      reviewType,
      isVerified: booking.status === 'completed',
      isVisible: true,
      isFlagged: false,
      responseText: null,
    });

    const savedReview = await this.reviewRepository.save(review);

    // Update user average rating
    await this.updateUserRating(revieweeId);

    return savedReview;
  }

  async addProviderResponse(userId: string, reviewId: string, dto: ProviderResponseDto): Promise<Review> {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException(`Review with ID ${reviewId} not found`);
    }

    if (review.reviewType !== ReviewType.CONSUMER) {
      throw new BadRequestException('Provider response is only allowed for consumer reviews');
    }

    if (review.revieweeId !== userId) {
      throw new ForbiddenException('Only the provider who received this review can respond');
    }

    review.responseText = dto.providerResponse;
    review.responseDate = new Date();

    return this.reviewRepository.save(review);
  }

  async findByBooking(bookingId: string): Promise<Review[]> {
    return this.reviewRepository
      .createQueryBuilder('review')
      .where('review.bookingId = :bookingId', { bookingId })
      .leftJoinAndSelect('review.reviewer', 'reviewer')
      .leftJoinAndSelect('review.reviewee', 'reviewee')
      .orderBy('review.createdAt', 'DESC')
      .getMany();
  }

  async findByUser(userId: string): Promise<Review[]> {
    return this.reviewRepository
      .createQueryBuilder('review')
      .where('review.revieweeId = :userId', { userId })
      .leftJoinAndSelect('review.reviewer', 'reviewer')
      .orderBy('review.createdAt', 'DESC')
      .take(50)
      .getMany();
  }

  async findLatest(limit = 5): Promise<Review[]> {
    const parsedLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 5;
    return this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.reviewer', 'reviewer')
      .leftJoinAndSelect('review.reviewee', 'reviewee')
      .where('review.isVisible = :isVisible', { isVisible: true })
      .orderBy('review.createdAt', 'DESC')
      .take(parsedLimit)
      .getMany();
  }

  private async updateUserRating(userId: string): Promise<void> {
    const reviews = await this.reviewRepository
      .createQueryBuilder('review')
      .where('review.revieweeId = :userId', { userId })
      .getMany();

    if (reviews.length === 0) return;

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    
    const user = await this.usersService.findOne(userId);
    (user as any).averageRating = Number(averageRating.toFixed(2));
    (user as any).totalReviews = reviews.length;
    
    // Note: averageRating and totalReviews are not stored in User entity
    // They are calculated fields, so we don't update them here
  }
}

