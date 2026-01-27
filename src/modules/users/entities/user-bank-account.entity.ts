import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_bank_accounts')
export class UserBankAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'bank_name', length: 100 })
  bankName: string; // 은행명

  @Column({ name: 'account_number', length: 50 })
  accountNumber: string; // 계좌번호

  @Column({ name: 'account_name', length: 100 })
  accountName: string; // 예금주명

  @Column({ name: 'branch', length: 100, nullable: true })
  branch?: string; // 지점명 (선택 사항)

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

