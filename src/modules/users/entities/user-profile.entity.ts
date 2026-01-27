import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'bio', type: 'text', nullable: true })
  bio: string; // 최소 50자

  // 주소 정보
  @Column({ name: 'address_line1', nullable: true })
  addressLine1: string;

  @Column({ name: 'address_line2', nullable: true })
  addressLine2: string;

  @Column({ name: 'city', nullable: true })
  city: string;

  @Column({ name: 'province', nullable: true })
  province: string;

  @Column({ name: 'postal_code', nullable: true })
  postalCode: string;

  @Column({ name: 'country', default: 'PH' })
  country: string; // 국가 코드 (기본값: 'PH')

  // 위치 정보 (GPS)
  @Column({ name: 'latitude', type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ name: 'longitude', type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  // 언어 및 통화
  @Column({ name: 'preferred_language', default: 'en' })
  preferredLanguage: string; // 선호 언어 (기본값: 'en')

  @Column({ name: 'preferred_currency', default: 'PHP' })
  preferredCurrency: string; // 선호 통화 (기본값: 'PHP')

  // 알림 설정
  @Column({ name: 'notification_email', default: true })
  notificationEmail: boolean; // 이메일 알림 수신 여부

  @Column({ name: 'notification_sms', default: true })
  notificationSms: boolean; // SMS 알림 수신 여부

  @Column({ name: 'notification_push', default: true })
  notificationPush: boolean; // 푸시 알림 수신 여부

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

