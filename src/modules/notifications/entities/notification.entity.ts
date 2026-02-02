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

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** DB 컬럼: type (varchar). notificationType 은 type 과 동일 값 유지 */
  @Column({
    name: 'type',
    type: 'varchar',
    length: 50,
  })
  notificationType: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'action_url', nullable: true })
  actionUrl: string;

  @Column({ name: 'related_type', nullable: true })
  relatedEntityType: string;

  @Column({ name: 'related_id', type: 'uuid', nullable: true })
  relatedEntityId: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ name: 'sent_via_push', default: false })
  sentViaPush: boolean;

  @Column({ name: 'sent_via_email', default: false })
  sentViaEmail: boolean;

  @Column({ name: 'sent_via_sms', default: false })
  sentViaSms: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // 하위 호환 (DB에 없음, insert/update 제외)
  @Column({ type: 'enum', enum: NotificationType, nullable: true, insert: false, update: false })
  type?: NotificationType;
}

