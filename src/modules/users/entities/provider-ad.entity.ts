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
import { Provider } from './provider.entity';

@Entity('provider_ads')
@Index(['providerId'])
@Index(['isActive'])
@Index(['startDate', 'endDate'])
export class ProviderAd {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'provider_id' })
  providerId: string;

  @ManyToOne(() => Provider, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  provider: Provider;

  // 배경 이미지
  @Column({ name: 'background_image_url', type: 'text', nullable: true })
  backgroundImageUrl?: string;

  // Provider 이름 (표시용, provider에서 가져올 수도 있음)
  @Column({ name: 'provider_name', type: 'varchar', length: 255 })
  providerName: string; // 회사명 또는 개인 이름

  // 서비스 영역 (카테고리)
  @Column({ name: 'service_area', type: 'varchar', length: 255, nullable: true })
  serviceArea?: string; // 예: "Home Services", "Moving Services" 등

  @Column({ name: 'service_categories', type: 'text', array: true, default: [] })
  serviceCategories: string[]; // 서비스 카테고리 배열

  // 홍보 배너 메시지
  @Column({ name: 'promo_message', type: 'text', nullable: true })
  promoMessage?: string; // 홍보 배너 메시지

  @Column({ name: 'promo_title', type: 'varchar', length: 255, nullable: true })
  promoTitle?: string; // 홍보 제목 (예: "Special Offer 1")

  // 할인 정보
  @Column({ name: 'has_discount', type: 'boolean', default: false })
  hasDiscount: boolean; // 할인 이벤트 여부

  @Column({ name: 'discount_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountPercentage?: number; // 할인율 (예: 20.00)

  @Column({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  discountAmount?: number; // 할인 금액

  @Column({ name: 'discount_description', type: 'varchar', length: 255, nullable: true })
  discountDescription?: string; // 할인 설명 (예: "Get up to 20% off")

  // 할인 기간
  @Column({ name: 'discount_start_date', type: 'timestamp', nullable: true })
  discountStartDate?: Date; // 할인 시작일

  @Column({ name: 'discount_end_date', type: 'timestamp', nullable: true })
  discountEndDate?: Date; // 할인 종료일

  // 광고 노출 기간
  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate?: Date; // 광고 노출 시작일

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate?: Date; // 광고 노출 종료일

  // 클릭 액션
  @Column({ name: 'action_url', type: 'text', nullable: true })
  actionUrl?: string; // 버튼 클릭 시 이동할 URL

  @Column({ name: 'action_text', type: 'varchar', length: 50, default: 'Learn More' })
  actionText: string; // 버튼 텍스트 (기본값: "Learn More")

  // 우선순위 및 정렬
  @Column({ name: 'priority', type: 'integer', default: 0 })
  priority: number; // 우선순위 (높을수록 먼저 표시)

  // 상태
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean; // 활성화 여부

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

