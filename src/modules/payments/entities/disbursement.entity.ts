import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('disbursements')
export class Disbursement {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  disbursement_id: string;

  @Column({ type: 'varchar', length: 50 })
  escrow_id: string;

  @Column({ type: 'uuid' })
  provider_id: string;

   // 선택: payout 단위와 매핑 (한 payout = 한 Xendit disbursement)
  @Column({ type: 'varchar', length: 50, nullable: true })
  payout_id: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  xendit_disbursement_id: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  external_id: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'PHP' })
  currency: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  bank_code: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  account_number: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  account_holder_name: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ewallet_type: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone_number: string | null;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  failure_code: string | null;

  @Column({ type: 'text', nullable: true })
  failure_message: string | null;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  processing_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
