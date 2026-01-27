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
import { User } from '../../users/entities/user.entity';
import { Provider } from '../../users/entities/provider.entity';
import { RFQ } from './rfq.entity';

export enum QuoteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('quotes')
@Index(['quoteNumber'], { unique: true })
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  quoteNumber: string; // 견적 번호 (고유값)

  @Column({ type: 'uuid' })
  clientId: string; // 클라이언트 ID

  @ManyToOne(() => User)
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column({ type: 'uuid' })
  providerId: string; // 제공자 ID

  @ManyToOne(() => Provider)
  @JoinColumn({ name: 'providerId' })
  provider: Provider;

  @Column({ type: 'uuid', nullable: true })
  rfqId: string; // RFQ ID (선택사항)

  @ManyToOne(() => RFQ, { nullable: true })
  @JoinColumn({ name: 'rfqId' })
  rfq: RFQ;

  @Column({ nullable: true })
  s3FilePath: string; // S3 파일 경로 (Quote 문서 저장 위치)

  @Column()
  serviceType: string; // 서비스 유형

  @Column()
  title: string; // 제목

  @Column({ type: 'text' })
  description: string; // 설명

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  budget: number; // 예산

  @Column({ nullable: true })
  timeline: string; // 타임라인 (예: "2 weeks")

  @Column({ type: 'timestamp', nullable: true })
  preferredSchedule: Date; // 선호 일정

  @Column({ type: 'jsonb', nullable: true })
  requirements: string[]; // 요구사항

  // 제공자 응답
  @Column({
    type: 'enum',
    enum: QuoteStatus,
    default: QuoteStatus.PENDING,
  })
  status: QuoteStatus;

  @Column({ type: 'text', nullable: true })
  providerMessage: string; // 제공자 메시지

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  proposedPrice: number; // 제안 가격

  @Column({ nullable: true })
  proposedTimeline: string; // 제안 타임라인

  @Column({ type: 'jsonb', nullable: true })
  milestones: Array<{
    milestoneId: string;
    name: string;
    description: string;
    price: number;
    dueDate: Date;
  }>; // 마일스톤

  @Column({ type: 'timestamp', nullable: true })
  respondedAt: Date; // 응답 시각

  @Column({ type: 'timestamp', nullable: true })
  responseDeadline: Date; // 응답 마감일

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

