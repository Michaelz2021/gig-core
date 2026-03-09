import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ServiceAddonGroup } from './service-addon-group.entity';

@Entity('service_addon_items')
export class ServiceAddonItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'group_id', type: 'uuid' })
  groupId: string;

  @ManyToOne(() => ServiceAddonGroup, (group) => group.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: ServiceAddonGroup;

  @Column({ length: 100 })
  label: string;

  @Column({ name: 'extra_price', type: 'decimal', precision: 10, scale: 2, default: 0 })
  extraPrice: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
