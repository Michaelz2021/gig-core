import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Provider } from '../../users/entities/provider.entity';

export enum RateType {
  PER_HOUR = 'per_hour',
  PER_PROJECT = 'per_project',
  PER_DAY = 'per_day',
}

export enum LocationType {
  PROVIDER_LOCATION = 'provider_location',
  CUSTOMER_LOCATION = 'customer_location',
  ONLINE = 'online',
  FLEXIBLE = 'flexible',
}

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'provider_id' })
  providerId: string;

  @ManyToOne(() => Provider, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  provider: Provider;

  @Column({ type: 'uuid', nullable: true, name: 'category_id' })
  categoryId: string; // FK → service_categories.id

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  // 평가 등급
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0, name: 'average_rating' })
  averageRating: number; // 평균 평점 (0.00-5.00)

  @Column({ default: 0, name: 'total_reviews' })
  totalReviews: number; // 총 리뷰 수

  // 가격 정보
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'base_rate' })
  baseRate: number; // 기본 요금 (PHP)

  @Column({
    type: 'enum',
    enum: RateType,
    default: RateType.PER_HOUR,
    name: 'rate_type',
  })
  rateType: RateType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'min_rate' })
  minRate: number; // 최소 요금

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'max_rate' })
  maxRate: number; // 최대 요금

  // 서비스 세부사항
  @Column({ nullable: true, name: 'duration_minutes' })
  durationMinutes: number; // 예상 소요 시간 (분)

  @Column({
    type: 'enum',
    enum: LocationType,
    nullable: true,
    name: 'location_type',
  })
  locationType: LocationType;

  @Column({ type: 'jsonb', nullable: true })
  images: string[];

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  // 상태
  @Column({ default: true, name: 'is_active' })
  isActive: boolean; // 활성화 여부

  @Column({ default: false, name: 'is_featured' })
  isFeatured: boolean; // 추천 서비스 여부

  // 통계
  @Column({ default: 0, name: 'views_count' })
  viewsCount: number; // 조회 수

  @Column({ default: 0, name: 'bookings_count' })
  bookingsCount: number; // 예약 수

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

