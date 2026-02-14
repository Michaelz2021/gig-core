import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('payouts')
export class Payout {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  payout_id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string; // JWT sub (provider의 user id) 로 조회

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'PHP' })
  currency: string;

  @Column({ type: 'varchar', length: 20 })
  payment_method: string; // gcash, bank, paymaya 등

  @Column({ type: 'jsonb', nullable: true })
  account_details: any; // { bank_code, account_number, account_holder_name, phone_number, ... }

  @Column({ type: 'varchar', length: 20, default: 'PROCESSING' })
  status: string; // PROCESSING | COMPLETED | FAILED

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  xendit_disbursement_id: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  failure_code: string | null;

  @Column({ type: 'text', nullable: true })
  failure_message: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  requested_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

