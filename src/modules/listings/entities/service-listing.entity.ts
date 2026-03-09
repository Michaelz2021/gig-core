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
import { Provider } from '../../users/entities/provider.entity';
import { ServiceCategory } from '../../services/entities/service-category.entity';
import { ServiceVariant } from './service-variant.entity';
import { ServiceAddonGroup } from './service-addon-group.entity';

@Entity('service_listings')
export class ServiceListing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'provider_id' })
  providerId: string;

  @ManyToOne(() => Provider, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  provider: Provider;

  @Column({ type: 'uuid', name: 'category_id' })
  categoryId: string;

  @ManyToOne(() => ServiceCategory, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: ServiceCategory;

  @Column({ length: 100 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 20, name: 'pricing_type', nullable: true, default: 'FIXED' })
  pricingType: string | null;

  /** FIXED일 때만 사용. VARIANT면 DB에서 null 허용 시 null */
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'fixed_price', nullable: true })
  fixedPrice: string | null;

  @Column({ type: 'jsonb', nullable: true, name: 'pricing_rules' })
  pricingRules: Record<string, unknown> | null;

  @Column({ name: 'pricing_addon', default: false })
  pricingAddon: boolean;

  @Column({ name: 'duration_minutes' })
  durationMinutes: number;

  @Column({ type: 'jsonb', nullable: true, name: 'service_areas' })
  serviceAreas: string[] | Record<string, unknown> | null;

  @Column({ name: 'advance_notice_hours', default: 1 })
  advanceNoticeHours: number;

  @Column({ name: 'is_instant_book', default: true })
  isInstantBook: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  photos: string[] | Record<string, unknown>[] | null;

  @OneToMany(() => ServiceVariant, (v) => v.service)
  variants: ServiceVariant[];

  @OneToMany(() => ServiceAddonGroup, (g) => g.service)
  addonGroups: ServiceAddonGroup[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
