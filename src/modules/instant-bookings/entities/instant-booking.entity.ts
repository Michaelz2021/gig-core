import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('instant_bookings')
export class InstantBooking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'service_category_id', type: 'uuid' })
  serviceCategoryId: string;

  @Column({ name: 'time_slot', type: 'timestamptz' })
  timeSlot: Date;

  @Column({ type: 'jsonb' })
  location: {
    option?: 'home' | 'site';
    address: string;
    lat: number;
    lng: number;
  };

  /** Array of { itemid, provider_response: "ACCEPTED"|"REJECTED", provider_response_at } */
  @Column({ name: 'ack_item_list', type: 'jsonb', nullable: true })
  ackItemList?: Array<{
    itemid: string;
    provider_response: 'ACCEPTED' | 'REJECTED';
    provider_response_at: string;
  }>;

  @Column({ length: 50, default: 'PENDING' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
