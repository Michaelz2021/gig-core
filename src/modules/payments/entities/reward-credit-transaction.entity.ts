import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Booking } from '../../bookings/entities/booking.entity';

export enum RewardCreditTransactionType {
  EARNED = 'earned',
  SPENT = 'spent',
  PURCHASED = 'purchased',
  BONUS = 'bonus',
  PENALTY = 'penalty',
  REFUNDED = 'refunded',
}

@Entity('reward_credit_transactions')
export class RewardCreditTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // 거래 정보
  @Column({
    name: 'transaction_type',
    type: 'enum',
    enum: RewardCreditTransactionType,
  })
  transactionType: RewardCreditTransactionType;

  @Column({ name: 'credits_change' })
  creditsChange: number; // 크레딧 변화량 (+/-)

  @Column({ name: 'credits_before' })
  creditsBefore: number; // 거래 전 크레딧

  @Column({ name: 'credits_after' })
  creditsAfter: number; // 거래 후 크레딧

  // 사유
  @Column({ nullable: true })
  reason: string; // 거래 사유

  @Column({ type: 'text', nullable: true })
  description: string; // 상세 설명

  @Column({ name: 'related_booking_id', type: 'uuid', nullable: true })
  relatedBookingId: string; // 관련 예약 ID

  @ManyToOne(() => Booking, { nullable: true })
  @JoinColumn({ name: 'related_booking_id' })
  relatedBooking: Booking;

  @Column({ name: 'related_auction_id', type: 'uuid', nullable: true })
  relatedAuctionId: string; // 관련 경매 ID

  // 만료 정보 (보너스 크레딧의 경우)
  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date; // 만료일

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

