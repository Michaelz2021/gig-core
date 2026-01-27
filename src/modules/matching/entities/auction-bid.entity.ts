import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Auction } from './auction.entity';
import { Provider } from '../../users/entities/provider.entity';

export enum AuctionBidStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  SHORTLISTED = 'shortlisted',
  SELECTED = 'selected',
  REJECTED = 'rejected',
}

@Entity('auction_bids')
export class AuctionBid {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'auction_id' })
  auctionId: string;

  @ManyToOne(() => Auction, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'auction_id' })
  auction: Auction;

  @Column({ type: 'uuid', name: 'provider_id' })
  providerId: string;

  @ManyToOne(() => Provider, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  provider: Provider;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'proposed_price' })
  proposedPrice: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'estimated_duration' })
  estimatedDuration: number;

  @Column({ type: 'text', nullable: true, name: 'work_plan' })
  workPlan: string;

  @Column({ type: 'jsonb', nullable: true, name: 'portfolio_items' })
  portfolioItems: Array<{
    url: string;
    caption?: string;
    description?: string;
  }>;

  @Column({ type: 'date', nullable: true, name: 'proposed_start_date' })
  proposedStartDate: Date;

  @Column({ type: 'date', nullable: true, name: 'proposed_completion_date' })
  proposedCompletionDate: Date;

  @Column({ type: 'text', nullable: true, name: 'additional_comment' })
  additionalComment?: string;

  @Column({ default: 0, name: 'credits_spent' })
  creditsSpent: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'ai_match_score' })
  aiMatchScore: number;

  @Column({ type: 'text', nullable: true, name: 'ai_recommendation' })
  aiRecommendation: string;

  @Column({
    type: 'enum',
    enum: AuctionBidStatus,
    default: AuctionBidStatus.SUBMITTED,
  })
  status: AuctionBidStatus;

  @Column({ type: 'timestamp', nullable: true, name: 'submitted_at' })
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'reviewed_at' })
  reviewedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'selected_at' })
  selectedAt: Date;

  @Column({ type: 'text', nullable: true, name: 'withdrawal_reason' })
  withdrawalReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
