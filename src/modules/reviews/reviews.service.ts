import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
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

    const revieweeId = booking.consumerId === reviewerId 
      ? booking.providerId 
      : booking.consumerId;

    const review = this.reviewRepository.create({
      ...createReviewDto,
      reviewerId,
      revieweeId,
    });

    const savedReview = await this.reviewRepository.save(review);

    // Update user average rating
    await this.updateUserRating(revieweeId);

    return savedReview;
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

  async findLatest(): Promise<Review[]> {
    return this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.reviewer', 'reviewer')
      .leftJoinAndSelect('review.reviewee', 'reviewee')
      .where('review.isVisible = :isVisible', { isVisible: true })
      .orderBy('review.createdAt', 'DESC')
      .take(5)
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

