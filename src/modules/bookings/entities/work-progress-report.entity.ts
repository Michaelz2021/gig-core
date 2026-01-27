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
import { Booking } from './booking.entity';

export enum ReportType {
  PROGRESS = 'progress',
}

@Entity('work_progress_reports')
@Index(['bookingId'])
@Index(['createdAt'])
@Index(['reportType'])
export class WorkProgressReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId: string;

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'report_type', type: 'varchar', length: 50, default: ReportType.PROGRESS })
  reportType: ReportType;

  // 메시지 필드 (notes, message, content 중 하나 필수)
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'text', nullable: true })
  content?: string;

  // 시간 필드 (created_at, reported_at, timestamp 중 하나 필수)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'reported_at', type: 'timestamp', nullable: true })
  reportedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  timestamp?: Date;

  // 선택적 필드
  @Column({ name: 'progress_percentage', type: 'int', nullable: true })
  progressPercentage?: number;

  @Column({ name: 'completed_tasks', type: 'jsonb', default: [] })
  completedTasks: string[];

  @Column({ type: 'jsonb', default: [] })
  photos: (string | { url: string; caption?: string })[];

  @Column({ type: 'jsonb', default: [] })
  evidence: { type: string; url: string; caption?: string }[];

  @Column({ name: 'next_steps', type: 'jsonb', default: [] })
  nextSteps: string[];

  @Column({ name: 'estimated_completion', type: 'timestamp', nullable: true })
  estimatedCompletion?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

