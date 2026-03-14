// src/modules/payments/entities/payment-session.entity.ts
import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('payment_sessions')
export class PaymentSession {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  session_id: string;

  @Column({ type: 'varchar', length: 50 })
  contract_id: string;

  @Column({ type: 'varchar', length: 50 })
  booking_id: string;

  /** Instant order인 경우에만 설정. 정식 오더는 null */
  @Column({ name: 'instant_booking_id', type: 'uuid', nullable: true })
  instant_booking_id?: string | null;

  @Column({ type: 'varchar', length: 50 })
  buyer_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  service_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  platform_fee: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  xendit_payment_id?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  xendit_payment_request_id?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  payment_method?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  channel_code?: string;

  @Column({ type: 'text', nullable: true })
  payment_url?: string;

  @Column({ type: 'text', nullable: true })
  qr_code?: string;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: string; // PENDING | PROCESSING | PAID | FAILED | EXPIRED

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  paid_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expires_at?: Date;

  @Column({ 
    type: 'timestamp', 
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP'
  })
  updated_at: Date;
}