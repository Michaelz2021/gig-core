import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TopTierProviderRanking } from '../entities/top-tier-provider-ranking.entity';
import { Provider } from '../entities/provider.entity';
import { TrustScore } from '../../trust-score/entities/trust-score.entity';
import { ServiceCategory } from '../../services/entities/service-category.entity';
import { TopTierProviderItemDto, CategoryDto } from '../dto/top-tier-provider-response.dto';

interface ProviderRankingData {
  providerId: string;
  trustScore?: number;
  ratingScore?: number;
  completionRate?: number;
  responseTimeMinutes?: number;
  yearsOfExperience?: number;
  totalJobsCompleted?: number;
  primaryCategory?: string;
  secondaryCategories?: string[];
}

@Injectable()
export class ProviderRankingService {
  constructor(
    @InjectRepository(TopTierProviderRanking)
    private readonly rankingRepository: Repository<TopTierProviderRanking>,
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    @InjectRepository(TrustScore)
    private readonly trustScoreRepository: Repository<TrustScore>,
    @InjectRepository(ServiceCategory)
    private readonly categoryRepository: Repository<ServiceCategory>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 단일 Provider의 랭킹 계산 및 업데이트
   */
  async calculateAndUpdateProviderRanking(providerId: string): Promise<TopTierProviderRanking> {
    // Provider 정보 조회
    const provider = await this.providerRepository.findOne({
      where: { id: providerId },
      relations: ['user'],
    });

    if (!provider || !provider.isActive) {
      throw new Error(`Active provider not found: ${providerId}`);
    }

    // Trust Score 조회
    const trustScore = await this.trustScoreRepository.findOne({
      where: { userId: provider.userId },
    });

    // Provider 통계 정보 수집
    const stats = await this.getProviderStatistics(providerId);

    // 사용자 이름 조합
    const name = provider.user
      ? `${provider.user.firstName} ${provider.user.lastName}`
      : null;

    // Display name 결정 (business_name 우선)
    const displayName = provider.businessName || name || 'Unknown Provider';

    // 점수 계산
    const scores = this.calculateScores({
      trustScore: trustScore?.currentScore || 0,
      ratingScore: stats.averageRating || 0,
      completionRate: stats.completionRate || 0,
      responseTimeMinutes: stats.responseTimeMinutes || null,
      yearsOfExperience: provider.yearsOfExperience || 0,
      totalJobsCompleted: stats.totalJobsCompleted || 0,
    });

    // SQL 함수를 사용하여 랭킹 계산 및 업데이트
    await this.dataSource.query(
      `SELECT calculate_provider_ranking(
        $1::UUID,
        $2::INTEGER,
        $3::DECIMAL,
        $4::DECIMAL,
        $5::DECIMAL,
        $6::INTEGER,
        $7::INTEGER,
        $8::VARCHAR,
        $9::TEXT[]
      )`,
      [
        providerId,
        scores.trustScore,
        scores.ratingScore,
        scores.completionRate,
        scores.responseTimeMinutes,
        scores.yearsOfExperience,
        scores.totalJobsCompleted,
        stats.primaryCategory || null,
        stats.secondaryCategories || [],
      ],
    );

    // 업데이트된 랭킹 정보 반환
    const ranking = await this.rankingRepository.findOne({
      where: { providerId },
      relations: ['provider', 'user'],
    });

    if (!ranking) {
      throw new Error(`Failed to create ranking for provider: ${providerId}`);
    }

    return ranking;
  }

  /**
   * 모든 활성 Provider의 랭킹 재계산
   */
  async recalculateAllRankings(): Promise<number> {
    const activeProviders = await this.providerRepository.find({
      where: { isActive: true },
    });

    let updatedCount = 0;
    for (const provider of activeProviders) {
      try {
        await this.calculateAndUpdateProviderRanking(provider.id);
        updatedCount++;
      } catch (error) {
        console.error(`Failed to calculate ranking for provider ${provider.id}:`, error);
      }
    }

    return updatedCount;
  }

  /**
   * Provider 통계 정보 조회
   */
  private async getProviderStatistics(providerId: string) {
    // Booking 통계
    const bookingStats = await this.dataSource.query(
      `
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
        AVG(CASE WHEN status = 'completed' AND actual_start_time IS NOT NULL AND actual_end_time IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (actual_end_time - actual_start_time)) / 60 
            ELSE NULL END) as avg_duration_minutes
      FROM bookings
      WHERE provider_id = $1
      `,
      [providerId],
    );

    // Review 통계
    const reviewStats = await this.dataSource.query(
      `
      SELECT 
        AVG(rating) as average_rating,
        COUNT(*) as total_reviews
      FROM reviews
      WHERE reviewee_id IN (
        SELECT user_id FROM providers WHERE id = $1
      )
      AND reviewer_type = 'consumer'
      `,
      [providerId],
    );

    // Service 카테고리 (가장 많이 제공한 카테고리)
    const categoryStats = await this.dataSource.query(
      `
      SELECT 
        sc.name as primary_category,
        ARRAY_AGG(DISTINCT sc2.name) FILTER (WHERE sc2.name IS NOT NULL) as secondary_categories
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.id
      LEFT JOIN services s2 ON s.provider_id = s2.provider_id AND s2.category_id != s.category_id
      LEFT JOIN service_categories sc2 ON s2.category_id = sc2.id
      WHERE s.provider_id = $1
      GROUP BY sc.name
      ORDER BY COUNT(*) DESC
      LIMIT 1
      `,
      [providerId],
    );

    const totalBookings = parseInt(bookingStats[0]?.total_bookings || '0', 10);
    const completedBookings = parseInt(bookingStats[0]?.completed_bookings || '0', 10);
    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

    return {
      totalJobsCompleted: completedBookings,
      averageRating: parseFloat(reviewStats[0]?.average_rating || '0'),
      completionRate,
      responseTimeMinutes: providerId ? null : null, // TODO: 실제 응답 시간 데이터가 있으면 추가
      primaryCategory: categoryStats[0]?.primary_category || null,
      secondaryCategories: categoryStats[0]?.secondary_categories || [],
    };
  }

  /**
   * 점수 계산
   */
  private calculateScores(stats: {
    trustScore: number;
    ratingScore: number;
    completionRate: number;
    responseTimeMinutes: number | null;
    yearsOfExperience: number;
    totalJobsCompleted: number;
  }) {
    return {
      trustScore: stats.trustScore,
      ratingScore: stats.ratingScore,
      completionRate: stats.completionRate,
      responseTimeMinutes: stats.responseTimeMinutes,
      yearsOfExperience: stats.yearsOfExperience,
      totalJobsCompleted: stats.totalJobsCompleted,
    };
  }

  /**
   * 랭킹 조회 (페이징 지원)
   */
  async getRankings(limit: number = 100, offset: number = 0): Promise<{
    items: TopTierProviderRanking[];
    total: number;
  }> {
    const [items, total] = await this.rankingRepository.findAndCount({
      where: { isActive: true },
      relations: ['provider', 'user'],
      order: { rankingPosition: 'ASC' },
      take: limit,
      skip: offset,
    });

    return { items, total };
  }

  /**
   * 카테고리별 랭킹 조회
   */
  async getRankingsByCategory(
    category: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<{
    items: TopTierProviderRanking[];
    total: number;
  }> {
    const [items, total] = await this.rankingRepository.findAndCount({
      where: {
        isActive: true,
        primaryCategory: category,
      },
      relations: ['provider', 'user'],
      order: { rankingPosition: 'ASC' },
      take: limit,
      skip: offset,
    });

    return { items, total };
  }

  /**
   * 특정 Provider의 랭킹 조회
   */
  async getProviderRanking(providerId: string): Promise<TopTierProviderRanking | null> {
    return this.rankingRepository.findOne({
      where: { providerId },
      relations: ['provider', 'user'],
    });
  }

  /**
   * Top Tier Providers 조회 (API 응답 형식)
   */
  async getTopTierProviders(limit: number = 10): Promise<{
    items: TopTierProviderItemDto[];
    totalCount: number;
    lastUpdated: Date;
  }> {
    // 최대 10개로 제한
    const actualLimit = Math.min(limit, 10);
    
    const [rankings, total] = await this.rankingRepository.findAndCount({
      where: { isActive: true },
      relations: ['provider', 'user'],
      order: { rankingPosition: 'ASC' },
      take: actualLimit,
    });

    if (rankings.length === 0) {
      return {
        items: [],
        totalCount: 0,
        lastUpdated: new Date(),
      };
    }

    // 리뷰 수 조회
    const reviewCounts = await this.dataSource.query(
      `
      SELECT 
        u.id as user_id,
        COUNT(r.id) as total_reviews
      FROM users u
      LEFT JOIN reviews r ON r.reviewee_id = u.id AND r.reviewer_type = 'consumer'
      WHERE u.id = ANY($1::uuid[])
      GROUP BY u.id
      `,
      [rankings.map(r => r.userId)],
    );

    const reviewCountMap = new Map<string, number>(
      reviewCounts.map((rc: any) => [rc.user_id, parseInt(String(rc.total_reviews || '0'), 10)]),
    );

    // 카테고리 정보 조회
    const categoryNames = rankings
      .map(r => r.primaryCategory)
      .filter((name): name is string => !!name);
    
    const categories = categoryNames.length > 0
      ? await this.categoryRepository.find({
          where: categoryNames.map(name => ({ name })),
        })
      : [];

    const categoryMap = new Map(categories.map(cat => [cat.name, cat]));

    // 사용자 정보 조회 (프로필 이미지, 검증 상태 등)
    const userIds = rankings.map(r => r.userId);
    const users = userIds.length > 0
      ? await this.dataSource.query(
          `
          SELECT 
            id,
            profile_photo_url,
            kyc_level
          FROM users
          WHERE id = ANY($1::uuid[])
          `,
          [userIds],
        )
      : [];

    const userMap = new Map<string, any>(users.map((u: any) => [u.id, u]));

    // 응답 형식으로 변환
    const items: TopTierProviderItemDto[] = rankings.map((ranking) => {
      const totalReviewsNum = reviewCountMap.get(ranking.userId) || 0;
      const reviewCountScore = Math.min(totalReviewsNum, 100); // 최대 100점

      const user: any = userMap.get(ranking.userId);

      // Primary Category 정보
      let primaryCategory: CategoryDto | undefined;
      if (ranking.primaryCategory) {
        const category = categoryMap.get(ranking.primaryCategory);
        if (category) {
          primaryCategory = {
            id: category.id,
            name: category.name,
          };
        }
      }

      return {
        ranking: ranking.rankingPosition,
        providerId: ranking.providerId,
        userId: ranking.userId,
        name: ranking.name || undefined,
        businessName: ranking.businessName || undefined,
        displayName: ranking.displayName,
        primaryCategory,
        categories: ranking.secondaryCategories || [],
        totalScore: parseFloat(String(ranking.totalScore)),
        trustScore: ranking.trustScore,
        ratingScore: parseFloat(String(ranking.ratingScore)),
        completionRateScore: parseFloat(String(ranking.completionRateScore)),
        responseTimeScore: parseFloat(String(ranking.responseTimeScore)),
        reviewCountScore,
        profileImageUrl: user?.profile_photo_url || undefined,
        isVerified: (user?.kyc_level && user.kyc_level !== 'basic') || false,
        totalJobsCompleted: ranking.totalJobsCompleted,
        totalReviews: totalReviewsNum,
        averageRating: parseFloat(String(ranking.averageRating)),
        lastCalculatedAt: ranking.lastCalculatedAt,
      };
    });

    // 가장 최근 업데이트 시간 찾기
    const lastUpdated = rankings.reduce((latest, ranking) => {
      return ranking.lastCalculatedAt > latest ? ranking.lastCalculatedAt : latest;
    }, rankings[0].lastCalculatedAt);

    return {
      items,
      totalCount: total,
      lastUpdated,
    };
  }
}

