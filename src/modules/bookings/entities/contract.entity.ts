import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { User } from '../../users/entities/user.entity';
import { Provider } from '../../users/entities/provider.entity';

@Entity('contracts')
export class Contract {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  contract_id: string;

  @Column({ type: 'varchar', length: 50 })
  booking_number: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_number', referencedColumnName: 'bookingNumber' })
  booking: Booking;

  @Column({ type: 'uuid' })
  consumer_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'consumer_id', referencedColumnName: 'id' })
  consumer: User;

  @Column({ type: 'uuid' })
  provider_id: string;

  @ManyToOne(() => Provider)
  @JoinColumn({ name: 'provider_id', referencedColumnName: 'id' })
  provider: Provider;

  @Column({ type: 'text' })
  service_description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  agreed_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  platform_fee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: 'jsonb', nullable: true })
  contract_terms: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 20, default: 'PENDING_SIGNATURES' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  consumer_signed_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  provider_signed_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  executed_at: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  blockchain_hash: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
