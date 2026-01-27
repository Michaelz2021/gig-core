import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { ReviewsService } from '../reviews/reviews.service';
import { TrustScore } from './entities/trust-score.entity';
import { UpdateTrustScoreDto } from './dto/update-trust-score.dto';

@Injectable()
export class TrustScoreService {
  constructor(
    @InjectRepository(TrustScore)
    private readonly trustScoreRepository: Repository<TrustScore>,
    private readonly usersService: UsersService,
    private readonly reviewsService: ReviewsService,
  ) {}

  async getTrustScore(userId: string) {
    let trustScore = await this.trustScoreRepository.findOne({
      where: { userId },
    });

    if (!trustScore) {
      // Create if doesn't exist
      trustScore = this.trustScoreRepository.create({
        userId,
        currentScore: 0,
      });
      trustScore = await this.trustScoreRepository.save(trustScore);
    }

    const user = await this.usersService.findOne(userId);
    const reviews = await this.reviewsService.findByUser(userId);

    // Calculate category scores
    const communicationScore = this.calculateCategoryScore(reviews, 'communicationRating', 95);
    const qualityScore = this.calculateCategoryScore(reviews, 'qualityRating', 92);
    const reliabilityScore = this.calculateCategoryScore(reviews, 'professionalismRating', 98);
    const punctualityScore = this.calculateCategoryScore(reviews, 'punctualityRating', 90);

    const overallScore = trustScore.currentScore || this.calculateOverallScore(user, reviews);

    return {
      userId: user.id,
      overallScore: Math.round(overallScore),
      categoryScores: {
        communication: communicationScore,
        quality: qualityScore,
        reliability: reliabilityScore,
        punctuality: punctualityScore,
      },
      factors: [
        {
          factor: 'Response Time',
          score: communicationScore,
          description: 'Excellent response time and clarity',
        },
        {
          factor: 'Work Quality',
          score: qualityScore,
          description: 'High-quality deliverables',
        },
        {
          factor: 'Deadline Adherence',
          score: punctualityScore,
          description: 'Always meets deadlines',
        },
      ],
      lastUpdated: trustScore.lastCalculatedAt || trustScore.updatedAt,
    };
  }

  async updateTrustScore(updateDto: UpdateTrustScoreDto) {
    const { userId, rating, feedback, categories } = updateDto;

    let trustScore = await this.trustScoreRepository.findOne({
      where: { userId },
    });

    if (!trustScore) {
      trustScore = this.trustScoreRepository.create({ userId });
    }

    // Update scores based on rating and categories
    if (rating) {
      const ratingScore = (rating / 5) * 200; // Max 200 points
      trustScore.qualityRatingScore = Math.max(trustScore.qualityRatingScore, ratingScore);
    }

    if (categories) {
      if (categories.communication) {
        trustScore.responseTimeScore = (categories.communication / 5) * 200;
      }
      if (categories.quality) {
        trustScore.qualityRatingScore = (categories.quality / 5) * 200;
      }
      if (categories.reliability) {
        trustScore.onTimeCompletionScore = (categories.reliability / 5) * 200;
      }
      if (categories.punctuality) {
        trustScore.onTimeCompletionScore = (categories.punctuality / 5) * 200;
      }
    }

    // Recalculate overall score
    trustScore.currentScore = Math.min(
      trustScore.onTimeCompletionScore +
      trustScore.qualityRatingScore +
      trustScore.responseTimeScore +
      trustScore.verificationScore +
      trustScore.transactionVolumeScore,
      1000
    );

    trustScore.lastCalculatedAt = new Date();
    trustScore = await this.trustScoreRepository.save(trustScore);

    // Update user trust score
    await this.usersService.updateTrustScore(userId, trustScore.currentScore);

    return {
      success: true,
      message: 'Trust score updated successfully',
      data: {
        userId,
        overallScore: trustScore.currentScore,
      },
    };
  }

  private calculateCategoryScore(reviews: any[], field: string, defaultScore: number): number {
    if (reviews.length === 0) return defaultScore;
    
    const scores = reviews
      .map((r) => r[field])
      .filter((s) => s !== null && s !== undefined);
    
    if (scores.length === 0) return defaultScore;
    
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    return Math.round((avg / 5) * 100);
  }

  private calculateOverallScore(user: any, reviews: any[]): number {
    const rating = user.averageRating || 0;
    const reviewCount = reviews.length;
    const bookings = user.completedBookings || 0;
    
    const accountAgeDays = Math.floor(
      (new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const accountAgeScore = Math.min(accountAgeDays / 365, 1) * 100;

    const kycScore = user.kycStatus === 'verified' ? 100 : 0;
    const reviewScore = Math.min(reviewCount / 50, 1) * 200;
    const bookingScore = Math.min(bookings / 100, 1) * 200;
    const ratingScore = (rating / 5) * 400;

    return Math.min(ratingScore + reviewScore + bookingScore + accountAgeScore + kycScore, 1000);
  }
}

