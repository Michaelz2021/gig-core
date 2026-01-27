import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum WalletStatus {
  ACTIVE = 'active',
  FROZEN = 'frozen',
  SUSPENDED = 'suspended',
}

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // users 테이블의 id와 1:1 매핑
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // 잔액
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance: number; // 총 잔액 (PHP)

  @Column({ name: 'escrow_balance', type: 'decimal', precision: 12, scale: 2, default: 0 })
  escrowBalance: number; // 에스크로 잔액 (보류 중 금액)

  @Column({ 
    name: 'available_balance', 
    type: 'decimal', 
    precision: 12, 
    scale: 2,
    insert: false, // INSERT 시 제외 (GENERATED COLUMN)
    update: false, // UPDATE 시 제외 (GENERATED COLUMN)
    select: true, // SELECT 시 포함
  })
  availableBalance: number; // 사용 가능 잔액 (balance - escrow_balance, GENERATED COLUMN)

  @Column({ length: 3, default: 'PHP' })
  currency: string; // 통화 (기본값: 'PHP')

  // 상태
  @Column({
    type: 'enum',
    enum: WalletStatus,
    default: WalletStatus.ACTIVE,
  })
  status: WalletStatus;

  // 한도
  @Column({ name: 'daily_limit', type: 'decimal', precision: 12, scale: 2, default: 50000 })
  dailyLimit: number;

  @Column({ name: 'monthly_limit', type: 'decimal', precision: 12, scale: 2, default: 500000 })
  monthlyLimit: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

