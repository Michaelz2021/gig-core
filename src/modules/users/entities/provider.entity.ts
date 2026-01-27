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
import { User } from './user.entity';

export enum BusinessType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
}

@Entity('providers')
export class Provider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // 사업자 정보
  @Column({ name: 'business_name', nullable: true })
  businessName: string; // 사업자명 (선택)

  @Column({
    name: 'business_type',
    type: 'enum',
    enum: BusinessType,
    default: BusinessType.INDIVIDUAL,
  })
  businessType: BusinessType;

  // 인증 데이터 (Verification Documents)
  @Column({ name: 'government_id_type', nullable: true })
  governmentIdType: string; // 신분증 유형 (예: Driver's License, UMID, SSS)

  @Column({ name: 'government_id_number', nullable: true })
  governmentIdNumber: string; // 신분증 번호 (암호화 저장 필요)

  @Column({ name: 'tin_number', nullable: true })
  tinNumber: string; // 납세자 번호 (TIN) (암호화 저장 필요)

  // 재능 및 경력
  @Column({ name: 'years_of_experience', default: 0 })
  yearsOfExperience: number; // 경력 연수

  @Column({ name: 'certifications', type: 'jsonb', nullable: true })
  certifications: Array<{
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate: string;
    certificateUrl: string;
  }>; // 자격증 목록

  @Column({ name: 'portfolio_photos', type: 'jsonb', nullable: true })
  portfolioPhotos: Array<{
    url: string;
    caption: string;
    uploadedAt: string;
  }>; // 포트폴리오 사진 (최소 3장)

  // 가용성
  @Column({ name: 'is_available', default: true })
  isAvailable: boolean; // 현재 가용 여부

  @Column({ name: 'available_days', type: 'integer', array: true, nullable: true })
  availableDays: number[]; // 가용 가능한 요일 배열 [1,2,3,4,5] = 월~금 (1=월요일, 7=일요일)

  @Column({ name: 'available_hours_start', type: 'time', nullable: true })
  availableHoursStart: string; // 가용 시간 시작 (예: '09:00')

  @Column({ name: 'available_hours_end', type: 'time', nullable: true })
  availableHoursEnd: string; // 가용 시간 종료 (예: '18:00')

  @Column({ name: 'instant_booking_enabled', default: false })
  instantBookingEnabled: boolean; // 즉시 예약 허용 여부

  @Column({ name: 'service_radius_km', default: 10 })
  serviceRadiusKm: number; // 서비스 반경 (km) (기본값: 10)

  // 성과 통계
  @Column({ name: 'response_time_minutes', nullable: true })
  responseTimeMinutes: number; // 평균 응답 시간 (분)

  @Column({ name: 'completion_rate', type: 'decimal', precision: 5, scale: 2, nullable: true })
  completionRate: number; // 완료율 (%)

  @Column({ name: 'total_jobs_completed', default: 0 })
  totalJobsCompleted: number; // 총 완료 작업 수

  // 상태
  @Column({ name: 'is_active', default: true })
  isActive: boolean; // 활성화 여부

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean; // 추천 제공자 여부

  // 알림 설정
  @Column({
    name: 'notification_preferences',
    type: 'jsonb',
    nullable: true,
  })
  notificationPreferences: {
    pushEnabled: boolean;
    smsEnabled: boolean;
    emailEnabled: boolean;
    auctionNotifications: boolean;
    minTrustScoreThreshold: number;
    preferredCategories: string[];
    maxDistanceKm: number;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

