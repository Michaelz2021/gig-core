import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { User } from '../../users/entities/user.entity';
import { Dispute } from '../../disputes/entities/dispute.entity';

export enum EscrowStatus {
  HELD = 'held',
  RELEASED = 'released',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed',
}

@Entity('escrows')
export class Escrow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  transactionId: string; // FK → transactions.id

  @Column({ type: 'uuid' })
  bookingId: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  // 당사자
  @Column({ type: 'uuid' })
  consumerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'consumerId' })
  consumer: User;

  @Column({ type: 'uuid' })
  providerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'providerId' })
  provider: User;

  // 금액
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  escrowAmount: number; // 에스크로 금액

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  releasedAmount: number; // 출금된 금액

  // 상태
  @Column({
    type: 'enum',
    enum: EscrowStatus,
    default: EscrowStatus.HELD,
  })
  status: EscrowStatus;

  // 출금 정보
  @Column({ type: 'date', nullable: true })
  releaseDate: Date; // 출금 예정일

  @Column({ type: 'date', nullable: true })
  autoReleaseDate: Date; // 자동 출금일 (완료 후 48시간)

  @Column({ type: 'timestamp', nullable: true })
  releasedAt: Date; // 실제 출금 시각

  // 분쟁 정보
  @Column({ type: 'uuid', nullable: true })
  disputeId: string; // 분쟁 ID

  @ManyToOne(() => Dispute, { nullable: true })
  @JoinColumn({ name: 'disputeId' })
  dispute: Dispute;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

