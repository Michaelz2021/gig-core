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
import { Wallet } from './wallet.entity';
import { User } from '../../users/entities/user.entity';
import { Booking } from '../../bookings/entities/booking.entity';

export enum WalletTransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRANSFER = 'transfer',
  PAYMENT = 'payment',
  REFUND = 'refund',
  FEE = 'fee',
  REWARD = 'reward',
}

export enum WalletTransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('wallet_transactions')
@Index(['transactionNumber'], { unique: true })
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  walletId: string;

  @ManyToOne(() => Wallet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  // 거래 정보
  @Column({ unique: true })
  transactionNumber: string; // 거래 번호 (고유값)

  @Column({
    type: 'enum',
    enum: WalletTransactionType,
  })
  type: WalletTransactionType;

  // 금액
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number; // 거래 금액

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fee: number; // 수수료

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  netAmount: number; // 순 금액

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  balanceBefore: number; // 거래 전 잔액

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  balanceAfter: number; // 거래 후 잔액

  // 상대방 정보
  @Column({ type: 'uuid', nullable: true })
  counterpartyId: string; // 상대방 ID (송금/수령 시)

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'counterpartyId' })
  counterparty: User;

  // 상태
  @Column({
    type: 'enum',
    enum: WalletTransactionStatus,
    default: WalletTransactionStatus.PENDING,
  })
  status: WalletTransactionStatus;

  // 설명
  @Column({ type: 'text', nullable: true })
  description: string; // 거래 설명

  @Column({ type: 'uuid', nullable: true })
  referenceId: string; // 참조 ID (예: booking_id)

  @ManyToOne(() => Booking, { nullable: true })
  @JoinColumn({ name: 'referenceId' })
  booking: Booking;

  // 결제 수단 정보
  @Column({ nullable: true })
  paymentMethod: string; // 결제 수단 ('gcash' | 'paymaya' | 'bank_transfer')

  @Column({ nullable: true })
  paymentReference: string; // 결제 참조 번호 (암호화 저장 필요)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

