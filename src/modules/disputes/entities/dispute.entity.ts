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
import { Booking } from '../../bookings/entities/booking.entity';
import { User } from '../../users/entities/user.entity';
import { Transaction } from '../../payments/entities/transaction.entity';

export enum DisputeStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  MEDIATION = 'mediation',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
}

export enum DisputeReason {
  QUALITY_ISSUE = 'quality_issue',
  PAYMENT_ISSUE = 'payment_issue',
  NO_SHOW = 'no_show',
  BREACH_OF_CONTRACT = 'breach_of_contract',
  OTHER = 'other',
}

@Entity('disputes')
@Index(['disputeNumber'], { unique: true })
export class Dispute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  disputeNumber: string; // 분쟁 번호 (고유값)

  @Column({ type: 'uuid' })
  bookingId: string;

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @Column({ type: 'uuid', nullable: true })
  transactionId: string; // FK → transactions.id

  @ManyToOne(() => Transaction, { nullable: true })
  @JoinColumn({ name: 'transactionId' })
  transaction: Transaction;

  // 당사자
  @Column({ type: 'uuid' })
  complainantId: string; // 제기자 ID

  @ManyToOne(() => User)
  @JoinColumn({ name: 'complainantId' })
  complainant: User;

  @Column({ type: 'uuid' })
  respondentId: string; // 피제기자 ID

  @ManyToOne(() => User)
  @JoinColumn({ name: 'respondentId' })
  respondent: User;

  // 하위 호환성
  @Column({ type: 'uuid', nullable: true })
  raisedBy: string; // 하위 호환성 유지

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'raisedBy' })
  raisedByUser: User;

  // 분쟁 정보
  @Column({
    type: 'enum',
    enum: DisputeReason,
    nullable: true,
  })
  disputeReason: DisputeReason;

  @Column({ nullable: true })
  reason: string; // 하위 호환성 유지

  @Column({ type: 'text' })
  disputeDescription: string; // 분쟁 설명

  @Column({ type: 'text', nullable: true })
  description: string; // 하위 호환성 유지

  @Column({ type: 'jsonb', nullable: true })
  evidencePhotos: string[]; // 증거 사진 URL 배열

  @Column({ type: 'jsonb', nullable: true })
  evidenceDocuments: string[]; // 증거 문서 URL 배열

  @Column({ type: 'jsonb', nullable: true })
  evidence: string[]; // 하위 호환성 유지

  // 중재 정보
  @Column({ type: 'uuid', nullable: true })
  assignedMediatorId: string; // 배정된 중재자 ID

  @Column({ type: 'text', nullable: true })
  aiRecommendation: string; // AI 중재 추천

  // 상태
  @Column({
    type: 'enum',
    enum: DisputeStatus,
    default: DisputeStatus.SUBMITTED,
  })
  status: DisputeStatus;

  // 결과
  @Column({ type: 'text', nullable: true })
  resolution: string; // 해결 방안

  @Column({ type: 'date', nullable: true })
  resolutionDate: Date; // 해결 날짜

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  compensationAmount: number; // 보상 금액

  // 만족도
  @Column({ nullable: true })
  complainantSatisfied: boolean; // 제기자 만족 여부

  @Column({ nullable: true })
  respondentSatisfied: boolean; // 피제기자 만족 여부

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;
}

