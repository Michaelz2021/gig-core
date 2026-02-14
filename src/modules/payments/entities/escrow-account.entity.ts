import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('escrow_accounts')
export class EscrowAccount {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  escrow_id: string;

  @Column({ type: 'varchar', length: 50 })
  contract_id: string;

  @Column({ type: 'uuid' })
  booking_id: string;

  @Column({ type: 'uuid' })
  buyer_id: string;

  @Column({ type: 'uuid' })
  provider_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  platform_fee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  provider_amount: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  payment_session_id: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  xendit_payment_id: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  xendit_disbursement_id: string | null;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  disbursement_status: string;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: string;

  // 선택: 한 payout에 여러 escrow를 묶기 위한 참조
  @Column({ type: 'varchar', length: 50, nullable: true })
  payout_id: string | null;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  funded_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  released_at: Date | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
