import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('service_categories')
export class ServiceCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // 카테고리 이름

  @Column({ nullable: true })
  slug: string; // URL 슬러그

  @Column({ type: 'text', nullable: true })
  description: string; // 카테고리 설명

  @Column({ name: 'parent_category_id', nullable: true })
  parentCategoryId: string; // 부모 카테고리 ID

  @Column({ name: 'is_active', default: true })
  isActive: boolean; // 활성화 여부

  @Column({ name: 'display_order', default: 0 })
  displayOrder: number; // 표시 순서

  @Column({ name: 'icon_url', type: 'text', nullable: true })
  iconUrl: string; // 아이콘 URL

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

