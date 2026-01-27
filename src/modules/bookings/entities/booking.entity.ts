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
import { Service } from '../../services/entities/service.entity';
import { Auction } from '../../matching/entities/auction.entity';
import { AuctionBid } from '../../matching/entities/auction-bid.entity';

export enum BookingStatus {
  PENDING_PAYMENT = 'pending_payment',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
  PENDING = 'pending', // Alias for backward compatibility
}

@Entity('bookings')
@Index(['bookingNumber'], { unique: true })
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_number', unique: true })
  bookingNumber: string; // 예약 번호 (고유값)

  @Column({ name: 'consumer_id', type: 'uuid' })
  consumerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'consumer_id' })
  consumer: User;

  @Column({ name: 'provider_id', type: 'uuid' })
  providerId: string;

  @ManyToOne(() => Provider)
  @JoinColumn({ name: 'provider_id' })
  provider: Provider;

  @Column({ name: 'service_id', type: 'uuid', nullable: true })
  serviceId?: string; // 서비스 ID (일반 예약인 경우 필수, auction 기반 예약인 경우 NULL)

  @ManyToOne(() => Service, { nullable: true })
  @JoinColumn({ name: 'service_id' })
  service?: Service;

  // 예약 정보
  @Column({ name: 'scheduled_date', type: 'timestamp', nullable: false })
  scheduledDate: Date; // 예약 날짜

  @Column({ name: 'scheduled_end_date', type: 'timestamp', nullable: true })
  scheduledEndDate?: Date; // 예약 종료 날짜

  @Column({ name: 'duration_minutes', nullable: true })
  durationMinutes?: number; // 예상 소요 시간

  // 위치 정보
  @Column({ name: 'location_address', type: 'text', nullable: true })
  locationAddress?: string; // 서비스 제공 주소

  @Column({ name: 'location_city', type: 'varchar', length: 100, nullable: true })
  locationCity?: string; // 도시

  @Column({ name: 'location_latitude', type: 'decimal', precision: 10, scale: 8, nullable: true })
  locationLatitude?: number;

  @Column({ name: 'location_longitude', type: 'decimal', precision: 11, scale: 8, nullable: true })
  locationLongitude?: number;

  @Column({ name: 'location_instructions', type: 'text', nullable: true })
  locationInstructions?: string; // 위치 지시사항

  // 금액
  @Column({ name: 'service_rate', type: 'decimal', precision: 10, scale: 2 })
  serviceRate: number; // 서비스 요금

  @Column({ name: 'subtotal', type: 'decimal', precision: 10, scale: 2 })
  subtotal: number; // 소계

  @Column({ name: 'platform_fee', type: 'decimal', precision: 10, scale: 2 })
  platformFee: number; // 플랫폼 수수료 (7%)

  @Column({ name: 'insurance_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  insuranceFee: number; // 보험료 (선택)

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number; // 총 금액

  @Column({ name: 'service_description', type: 'text', nullable: true })
  serviceDescription?: string; // 서비스 설명

  @Column({ name: 'task', type: 'text', nullable: true })
  task?: string; // 서비스 작업 내용 (계약서에서 명문화될 수 있는 경우)

  // 상태
  @Column({
    name: 'status',
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  // 타임스탬프
  @Column({ name: 'actual_start_time', type: 'timestamp', nullable: true })
  actualStartTime?: Date; // 실제 시작 시각

  @Column({ name: 'actual_end_time', type: 'timestamp', nullable: true })
  actualEndTime?: Date; // 실제 종료 시각

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt?: Date; // 취소 시각

  @Column({ name: 'cancelled_by', type: 'uuid', nullable: true })
  cancelledBy?: string; // 취소한 사용자 ID

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason?: string; // 취소 사유

  @Column({ name: 'special_instructions', type: 'text', nullable: true })
  specialInstructions?: string; // 특별 요청사항

  @Column({ name: 'has_insurance', type: 'boolean', default: false })
  hasInsurance: boolean; // 보험 포함 여부

  @Column({ name: 'is_instant_booking', type: 'boolean', default: false })
  isInstantBooking: boolean; // 즉시 예약 여부

  // Auction 관계 (auction 기반 예약인 경우)
  @Column({ name: 'auction_id', type: 'uuid', nullable: true })
  auctionId?: string;

  @ManyToOne(() => Auction, { nullable: true })
  @JoinColumn({ name: 'auction_id' })
  auction?: Auction;

  @Column({ name: 'auction_bid_id', type: 'uuid', nullable: true })
  auctionBidId?: string;

  @ManyToOne(() => AuctionBid, { nullable: true })
  @JoinColumn({ name: 'auction_bid_id' })
  auctionBid?: AuctionBid;

  // 하위 호환성을 위한 주소 필드
  @Column({ type: 'jsonb', nullable: true })
  address: {
    street?: string;
    city?: string;
    province?: string;
    zipCode?: string;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

