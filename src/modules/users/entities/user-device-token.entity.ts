import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum AppMode {
  CONSUMER = 'consumer',
  PROVIDER = 'provider',
}

export enum DevicePlatform {
  ANDROID = 'android',
  IOS = 'ios',
  WEB = 'web',
}

@Entity('user_device_tokens')
@Index(['userId', 'appMode'])
@Index(['fcmToken'], { unique: true })
export class UserDeviceToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'fcm_token', type: 'text' })
  fcmToken: string;

  @Column({
    name: 'app_mode',
    type: 'enum',
    enum: AppMode,
  })
  appMode: AppMode; // 'consumer' | 'provider'

  @Column({
    name: 'platform',
    type: 'enum',
    enum: DevicePlatform,
  })
  platform: DevicePlatform; // 'android' | 'ios' | 'web'

  @Column({ name: 'device_id', type: 'text', nullable: true })
  deviceId?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
