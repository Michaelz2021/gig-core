import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('trust_score_history')
export class TrustScoreHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  scoreChange: number; // 점수 변화량 (+/-)

  @Column()
  previousScore: number; // 이전 점수

  @Column()
  newScore: number; // 새로운 점수

  @Column({ nullable: true })
  reasonCode: string; // 변경 사유 코드

  @Column({ type: 'text', nullable: true })
  reasonDescription: string; // 변경 사유 설명

  @Column({ type: 'uuid', nullable: true })
  relatedTransactionId: string; // 관련 거래 ID

  @ManyToOne(() => Booking, { nullable: true })
  @JoinColumn({ name: 'relatedTransactionId' })
  relatedTransaction: Booking;

  @CreateDateColumn()
  createdAt: Date;
}

