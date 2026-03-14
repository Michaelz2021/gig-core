import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('instant_invoice')
export class InstantInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'listing_id', type: 'uuid' })
  listingId: string;

  @Column({ name: 'consumer_id', type: 'uuid' })
  consumerId: string;

  @Column({ name: 'provider_id', type: 'uuid' })
  providerId: string;

  @Column({ name: 'listing_name', type: 'varchar', length: 500, nullable: true })
  listingName: string | null;

  @Column({ name: 'consumer_name', type: 'varchar', length: 255, nullable: true })
  consumerName: string | null;

  @Column({ name: 'provider_name', type: 'varchar', length: 255, nullable: true })
  providerName: string | null;

  @Column({ name: 'instant_booking_id', type: 'uuid' })
  instantBookingId: string;

  @Column({ name: 'service_date', type: 'date' })
  serviceDate: string;

  @Column({ name: 'service_time', type: 'time' })
  serviceTime: string;

  @Column({ name: 'service_address', type: 'text' })
  serviceAddress: string;

  @Column({ name: 'service_lat', type: 'decimal', precision: 10, scale: 8, nullable: true })
  serviceLat: string | null;

  @Column({ name: 'service_lng', type: 'decimal', precision: 11, scale: 8, nullable: true })
  serviceLng: string | null;

  /** 서비스 장소 옵션: Home | On Site */
  @Column({ name: 'service_address_option', type: 'varchar', length: 20, nullable: true })
  serviceAddressOption: string | null;

  @Column({ name: 'price_type', length: 20, default: 'FIXED' })
  priceType: string;

  @Column({ name: 'variant_id', type: 'uuid', nullable: true })
  variantId: string | null;

  @Column({ name: 'addon_item_ids', type: 'uuid', array: true, nullable: true })
  addonItemIds: string[] | null;

  @Column({ name: 'extra_person_count', default: 0 })
  extraPersonCount: number;

  @Column({ name: 'base_price', type: 'decimal', precision: 10, scale: 2 })
  basePrice: string;

  @Column({ name: 'addons_total', type: 'decimal', precision: 10, scale: 2, default: 0 })
  addonsTotal: string;

  @Column({ name: 'person_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  personFee: string;

  @Column({ name: 'travel_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  travelFee: string;

  @Column({ name: 'final_price', type: 'decimal', precision: 10, scale: 2 })
  finalPrice: string;

  @Column({ name: 'service_amount', type: 'decimal', precision: 10, scale: 2 })
  serviceAmount: string;

  @Column({ name: 'platform_fee', type: 'decimal', precision: 10, scale: 2 })
  platformFee: string;

  @Column({ name: 'vatable_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  vatableAmount: string | null;

  @Column({ name: 'vat_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  vatAmount: string | null;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: string;

  @Column({ name: 'consumer_notes', type: 'text', nullable: true })
  consumerNotes: string | null;

  @Column({ name: 'booking_status', length: 50, default: 'confirmed' })
  bookingStatus: string;

  @Column({ name: 'payment_status', length: 50, default: 'pending' })
  paymentStatus: string;

  @Column({ name: 'settlement_status', length: 50, default: 'pending' })
  settlementStatus: string;

  @Column({ name: 'payment_ref', length: 100, nullable: true })
  paymentRef: string | null;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
