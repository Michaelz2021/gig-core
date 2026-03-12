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

  @Column({ type: 'uuid', name: 'wallet_id' })
  walletId: string;

  @ManyToOne(() => Wallet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // 거래 정보
  @Column({ unique: true, name: 'transaction_number' })
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

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'net_amount' })
  netAmount: number; // 순 금액

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'balance_before' })
  balanceBefore: number; // 거래 전 잔액

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'balance_after' })
  balanceAfter: number; // 거래 후 잔액

  // 상대방 정보
  @Column({ type: 'uuid', nullable: true, name: 'counterparty_id' })
  counterpartyId: string; // 상대방 ID (송금/수령 시)

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'counterparty_id' })
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

  @Column({ type: 'uuid', nullable: true, name: 'reference_id' })
  referenceId: string; // 참조 ID (예: booking_id)

  @ManyToOne(() => Booking, { nullable: true })
  @JoinColumn({ name: 'reference_id' })
  booking: Booking;

  // 결제 수단 정보
  @Column({ nullable: true, name: 'payment_method' })
  paymentMethod: string; // 결제 수단 ('gcash' | 'paymaya' | 'bank_transfer')

  @Column({ nullable: true, name: 'payment_reference' })
  paymentReference: string; // 결제 참조 번호 (암호화 저장 필요)

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}