import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('instant_service_list')
export class InstantServiceList {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @Column({ name: 'icon_url', type: 'text', nullable: true })
  iconUrl: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
