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
import { Booking } from '../../bookings/entities/booking.entity';
import { User } from '../../users/entities/user.entity';
import { Provider } from '../../users/entities/provider.entity';
import { Escrow } from './escrow.entity';

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}

@Entity('transactions')
@Index(['transactionNumber'], { unique: true })
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  transactionNumber: string; // 거래 번호 (고유값)

  @Column({ type: 'uuid' })
  bookingId: string;

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @Column({ type: 'uuid' })
  consumerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'consumerId' })
  consumer: User;

  @Column({ type: 'uuid' })
  providerId: string;

  @ManyToOne(() => Provider)
  @JoinColumn({ name: 'providerId' })
  provider: Provider;

  // 금액 내역
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number; // 총 금액

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  serviceAmount: number; // 서비스 금액

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  platformFee: number; // 플랫폼 수수료 (7%)

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  insuranceFee: number; // 보험료 (선택)

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  providerAmount: number; // 제공자 수령액

  // 결제 정보
  @Column({ nullable: true })
  paymentMethod: string; // 결제 수단

  @Column({ nullable: true })
  paymentReference: string; // 결제 참조 번호

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date; // 결제 시각

  // 에스크로 정보
  @Column({ type: 'uuid', nullable: true })
  escrowId: string; // 에스크로 ID

  @ManyToOne(() => Escrow, { nullable: true })
  @JoinColumn({ name: 'escrowId' })
  escrow: Escrow;

  // 상태
  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  // 환불 정보
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundAmount: number; // 환불 금액

  @Column({ type: 'text', nullable: true })
  refundReason: string; // 환불 사유

  @Column({ type: 'timestamp', nullable: true })
  refundedAt: Date; // 환불 시각

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

