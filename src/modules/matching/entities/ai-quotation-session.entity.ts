import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Auction } from './auction.entity';

export enum QuotationSessionStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

@Entity('ai_quotation_sessions')
export class AIQuotationSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // 세션 정보
  @Column({ nullable: true })
  sessionNumber: string; // 세션 번호

  @Column({
    type: 'enum',
    enum: QuotationSessionStatus,
    default: QuotationSessionStatus.IN_PROGRESS,
  })
  status: QuotationSessionStatus;

  // 대화 내용
  @Column({ type: 'jsonb', nullable: true })
  conversationHistory: Array<{
    role: 'ai' | 'user';
    message: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>; // 대화 이력

  // 수집된 정보
  @Column({ nullable: true })
  serviceCategory: string; // 서비스 카테고리

  @Column({ type: 'text', nullable: true })
  serviceDescription: string; // 서비스 설명

  @Column({ type: 'text', nullable: true })
  location: string; // 서비스 위치

  @Column({ type: 'date', nullable: true })
  preferredDate: Date; // 희망 날짜

  @Column({ type: 'time', nullable: true })
  preferredTime: string; // 희망 시간

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  budgetRangeMin: number; // 예산 최소값

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  budgetRangeMax: number; // 예산 최대값

  @Column({ type: 'text', nullable: true })
  specialRequirements: string; // 특별 요구사항

  @Column({ type: 'jsonb', nullable: true })
  photos: string[]; // 업로드된 사진 URL 배열

  // AI 분석 결과
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  aiEstimatedPrice: number; // AI 추정 가격

  @Column({ nullable: true })
  aiEstimatedDuration: number; // AI 추정 소요 시간 (분)

  @Column({ type: 'jsonb', nullable: true })
  aiSuggestedProviders: Array<{
    providerId: string;
    providerName: string;
    matchScore: number;
    reason: string;
  }>; // AI 추천 제공자 목록

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  aiConfidenceScore: number; // AI 신뢰도 점수 (0-100)

  // 결과
  @Column({ default: false })
  convertedToAuction: boolean; // 경매로 전환 여부

  @Column({ type: 'uuid', nullable: true })
  auctionId: string; // 생성된 경매 ID

  @ManyToOne(() => Auction, { nullable: true })
  @JoinColumn({ name: 'auctionId' })
  auction: Auction;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;
}

