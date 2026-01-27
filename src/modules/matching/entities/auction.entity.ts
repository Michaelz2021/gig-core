import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AuctionStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  BIDDING = 'bidding',
  REVIEWING = 'reviewing',
  SELECTED = 'selected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('auctions')
@Index(['auctionNumber'], { unique: true })
export class Auction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, name: 'auction_number' })
  auctionNumber: string; // 경매 번호 (고유값)

  @Column({ type: 'uuid', name: 'consumer_id' })
  consumerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'consumer_id' })
  consumer: User;

  // 서비스 정보
  @Column({ type: 'uuid', nullable: true, name: 'service_category_id' })
  serviceCategoryId: string; // FK → service_categories.id

  @Column({ name: 'service_title' })
  serviceTitle: string; // 서비스 제목

  @Column({ type: 'text', name: 'service_description' })
  serviceDescription: string; // 상세 설명

  @Column({ type: 'text', nullable: true, name: 'service_requirements' })
  serviceRequirements: string; // 요구사항

  // 위치 및 일정
  @Column({ type: 'text', name: 'service_location' })
  serviceLocation: string; // 서비스 위치

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true, name: 'location_latitude' })
  locationLatitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true, name: 'location_longitude' })
  locationLongitude: number;

  @Column({ type: 'date', nullable: true, name: 'preferred_date' })
  preferredDate: Date; // 희망 날짜

  @Column({ type: 'time', nullable: true, name: 'preferred_time' })
  preferredTime: string; // 희망 시간

  @Column({ type: 'timestamp', nullable: true })
  deadline: Date; // 입찰 마감 시간

  // 예산
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'budget_min' })
  budgetMin: number; // 최소 예산

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'budget_max' })
  budgetMax: number; // 최대 예산

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'ai_fair_price' })
  aiFairPrice: number; // AI 산정 적정가

  // 첨부 자료
  @Column({ type: 'jsonb', nullable: true })
  photos: string[]; // 사진 URL 배열

  @Column({ type: 'jsonb', nullable: true })
  documents: string[]; // 문서 URL 배열

  // 경매 설정
  @Column({ default: false, name: 'auto_select_enabled' })
  autoSelectEnabled: boolean; // 자동 선택 활성화 여부

  @Column({ nullable: true, name: 'max_bids_to_receive' })
  maxBidsToReceive: number; // 최대 수령 입찰 수

  // 상태
  @Column({
    type: 'enum',
    enum: AuctionStatus,
    default: AuctionStatus.DRAFT,
  })
  status: AuctionStatus;

  // 통계
  @Column({ default: 0, name: 'total_views' })
  totalViews: number; // 조회 수

  @Column({ default: 0, name: 'total_bids' })
  totalBids: number; // 총 입찰 수

  // 선택 정보
  @Column({ type: 'uuid', nullable: true, name: 'selected_bid_id' })
  selectedBidId: string; // 선택된 입찰 ID

  @Column({ type: 'text', nullable: true, name: 'selection_reason' })
  selectionReason: string; // 선택 사유

  @Column({ type: 'timestamp', nullable: true, name: 'selected_at' })
  selectedAt: Date; // 선택 시각

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'expired_at' })
  expiredAt: Date;
}

