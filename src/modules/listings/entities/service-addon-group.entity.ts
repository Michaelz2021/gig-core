import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ServiceListing } from './service-listing.entity';
import { ServiceAddonItem } from './service-addon-item.entity';

@Entity('service_addon_groups')
export class ServiceAddonGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'service_id', type: 'uuid' })
  serviceId: string;

  @ManyToOne(() => ServiceListing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: ServiceListing;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'is_required', default: false })
  isRequired: boolean;

  @Column({ name: 'is_multiple', default: false })
  isMultiple: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @OneToMany(() => ServiceAddonItem, (item) => item.group)
  items: ServiceAddonItem[];
}
