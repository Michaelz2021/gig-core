import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Provider } from './provider.entity';
import { User } from './user.entity';

@Entity('top_tier_providers_ranking')
@Index(['rankingPosition'])
@Index(['totalScore'])
@Index(['providerId'])
@Index(['userId'])
export class TopTierProviderRanking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 랭킹 위치
  @Column({ name: 'ranking_position', type: 'integer' })
  rankingPosition: number; // 실시간 랭킹 위치 (1부터 시작)

  // Provider 정보
  @Column({ name: 'provider_id', type: 'uuid' })
  providerId: string;

  @ManyToOne(() => Provider)
  @JoinColumn({ name: 'provider_id' })
  provider: Provider;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // 이름 정보
  @Column({ name: 'name', type: 'varchar', length: 255, nullable: true })
  name?: string; // 사용자 이름 (firstName + lastName)

  @Column({ name: 'business_name', type: 'varchar', length: 255, nullable: true })
  businessName?: string; // 사업자명

  @Column({ name: 'display_name', type: 'varchar', length: 255 })
  displayName: string; // 표시 이름 (businessName 우선, 없으면 name)

  // 서비스 전문 카테고리
  @Column({ name: 'primary_category', type: 'varchar', length: 100, nullable: true })
  primaryCategory?: string; // 주요 카테고리

  @Column({ name: 'secondary_categories', type: 'text', array: true, default: [] })
  secondaryCategories: string[]; // 보조 카테고리 배열

  // 스코어 점수
  @Column({ name: 'total_score', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalScore: number; // 종합 점수

  @Column({ name: 'trust_score', type: 'integer', default: 0 })
  trustScore: number; // 신뢰 점수 (0-1000)

  @Column({ name: 'rating_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  ratingScore: number; // 평점 점수 (0-5.00)

  @Column({ name: 'completion_rate_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  completionRateScore: number; // 완료율 점수 (0-100)

  @Column({ name: 'response_time_score', type: 'decimal', precision: 10, scale: 2, default: 0 })
  responseTimeScore: number; // 응답 시간 점수 (분 단위, 낮을수록 좋음)

  @Column({ name: 'experience_score', type: 'integer', default: 0 })
  experienceScore: number; // 경력 점수 (년 단위)

  @Column({ name: 'transaction_volume_score', type: 'integer', default: 0 })
  transactionVolumeScore: number; // 거래량 점수 (완료된 작업 수)

  // 통계 정보
  @Column({ name: 'total_jobs_completed', type: 'integer', default: 0 })
  totalJobsCompleted: number; // 총 완료 작업 수

  @Column({ name: 'average_rating', type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number; // 평균 평점

  @Column({ name: 'completion_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  completionRate: number; // 완료율 (%)

  @Column({ name: 'response_time_minutes', type: 'decimal', precision: 10, scale: 2, nullable: true })
  responseTimeMinutes?: number; // 평균 응답 시간 (분)

  @Column({ name: 'years_of_experience', type: 'integer', default: 0 })
  yearsOfExperience: number; // 경력 연수

  // 랭킹 계산 정보
  @Column({ name: 'last_calculated_at', type: 'timestamp' })
  lastCalculatedAt: Date; // 마지막 계산 시각

  @Column({ name: 'calculation_version', type: 'varchar', length: 50, default: 'v1.0' })
  calculationVersion: string; // 계산 버전

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean; // 활성 상태 (isActive가 false인 provider는 랭킹에서 제외)

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

