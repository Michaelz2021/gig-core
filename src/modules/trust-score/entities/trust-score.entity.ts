import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TrustScoreCategory {
  POOR = 'poor',
  FAIR = 'fair',
  GOOD = 'good',
  VERY_GOOD = 'very_good',
  EXCELLENT = 'excellent',
}

@Entity('trust_scores')
export class TrustScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // 종합 점수
  @Column({ name: 'current_score', type: 'integer', default: 0 })
  currentScore: number; // 현재 신뢰 점수 (0-1000)

  @Column({
    name: 'score_category',
    type: 'enum',
    enum: TrustScoreCategory,
    default: TrustScoreCategory.POOR,
  })
  scoreCategory: TrustScoreCategory;
  /*
  점수 구간:
  - poor: 0-299
  - fair: 300-499
  - good: 500-699
  - very_good: 700-849
  - excellent: 850-1000
  */

  // 점수 구성 요소 (각 최대 200점)
  @Column({ name: 'on_time_completion_score', type: 'integer', default: 0 })
  onTimeCompletionScore: number; // 시간 준수 점수

  @Column({ name: 'quality_rating_score', type: 'integer', default: 0 })
  qualityRatingScore: number; // 품질 평가 점수

  @Column({ name: 'response_time_score', type: 'integer', default: 0 })
  responseTimeScore: number; // 응답 시간 점수

  @Column({ name: 'verification_score', type: 'integer', default: 0 })
  verificationScore: number; // 인증 점수

  @Column({ name: 'transaction_volume_score', type: 'integer', default: 0 })
  transactionVolumeScore: number; // 거래량 점수

  // 통계
  @Column({ name: 'total_transactions', default: 0 })
  totalTransactions: number; // 총 거래 수

  @Column({ name: 'successful_transactions', default: 0 })
  successfulTransactions: number; // 성공한 거래 수

  @Column({ name: 'disputed_transactions', default: 0 })
  disputedTransactions: number; // 분쟁 거래 수

  @Column({ name: 'average_rating', type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number; // 평균 평점

  @Column({ name: 'last_calculated_at', type: 'timestamp', nullable: true })
  lastCalculatedAt: Date; // 마지막 계산 시각

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Note: created_at 컬럼은 데이터베이스에 없으므로 제거됨
}

