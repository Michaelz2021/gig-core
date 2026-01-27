import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Quote } from './quote.entity';

export enum RFQStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

@Entity('rfqs')
export class RFQ {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  rfqNumber: string;

  @Column({ type: 'uuid' })
  consumerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'consumerId' })
  consumer: User;

  @Column({ type: 'uuid', nullable: true })
  auctionId: string; // Auction ID (선택사항, Auction에서 생성된 RFQ인 경우)

  @Column()
  serviceType: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  budgetMin: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  budgetMax: number;

  @Column({ nullable: true })
  timeline: string;

  @Column({ type: 'timestamp', nullable: true })
  preferredSchedule: Date;

  @Column({ type: 'jsonb', nullable: true })
  requirements: string[];

  @Column({ type: 'text', nullable: true })
  location: string;

  @Column({ type: 'jsonb', nullable: true })
  photos: string[];

  @Column({ type: 'jsonb', nullable: true })
  documents: string[];

  @Column({
    type: 'enum',
    enum: RFQStatus,
    default: RFQStatus.OPEN,
  })
  status: RFQStatus;

  @Column({ type: 'timestamp', nullable: true })
  deadline: Date;

  @Column({ nullable: true })
  s3FolderPath: string;

  @OneToMany(() => Quote, (quote) => quote.rfq)
  quotes: Quote[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
