import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  BOOKING = 'booking',
  PAYMENT = 'payment',
  REVIEW = 'review',
  MESSAGE = 'message',
  AUCTION = 'auction',
  QUOTE = 'quote',
  RFQ = 'rfq',
  SYSTEM = 'system',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  notificationType: NotificationType; // 알림 유형

  @Column()
  title: string; // 알림 제목

  @Column({ type: 'text' })
  message: string; // 알림 내용

  // 링크 정보
  @Column({ nullable: true })
  actionUrl: string; // 액션 URL

  @Column({ nullable: true })
  relatedEntityType: string; // 관련 엔티티 유형

  @Column({ type: 'uuid', nullable: true })
  relatedEntityId: string; // 관련 엔티티 ID

  // 우선순위
  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  priority: NotificationPriority;

  // 상태
  @Column({ default: false })
  isRead: boolean; // 읽음 여부

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date; // 읽은 시각

  // 전송 채널
  @Column({ default: false })
  sentViaPush: boolean; // 푸시 알림 전송 여부

  @Column({ default: false })
  sentViaEmail: boolean; // 이메일 전송 여부

  @Column({ default: false })
  sentViaSms: boolean; // SMS 전송 여부

  // 만료
  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date; // 만료 시각

  // 하위 호환성
  @Column({
    type: 'enum',
    enum: NotificationType,
    nullable: true,
  })
  type: NotificationType; // 하위 호환성 유지

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // 메타데이터

  @CreateDateColumn()
  createdAt: Date;
}

