import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('reward_payment_sessions')
export class RewardPaymentSession {
  @PrimaryColumn({ type: 'varchar', length: 80 })
  session_id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'int' })
  credits: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ name: 'service_amount', type: 'decimal', precision: 10, scale: 2 })
  service_amount: number;

  @Column({ name: 'platform_fee', type: 'decimal', precision: 10, scale: 2 })
  platform_fee: number;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: string;

  @Column({ name: 'xendit_payment_id', type: 'varchar', length: 100, nullable: true })
  xenditPaymentId?: string;

  @Column({ name: 'xendit_payment_request_id', type: 'varchar', length: 100, nullable: true })
  xenditPaymentRequestId?: string;

  @Column({ name: 'payment_method', type: 'varchar', length: 20, nullable: true })
  paymentMethod?: string;

  @Column({ name: 'channel_code', type: 'varchar', length: 50, nullable: true })
  channelCode?: string;

  @Column({ name: 'payment_url', type: 'text', nullable: true })
  paymentUrl?: string;

  @Column({ name: 'qr_code', type: 'text', nullable: true })
  qrCode?: string;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt?: Date;

  @Column({ name: 'reason', type: 'text', nullable: true })
  reason?: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expires_at?: Date;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
