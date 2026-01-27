import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Provider } from './provider.entity';

@Entity('portfolios')
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'provider_id' })
  providerId: string;

  @ManyToOne(() => Provider, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  provider: Provider;

  @Column({ type: 'text', name: 'image_url' })
  imageUrl: string; // 이미지 URL

  @Column({ type: 'text', nullable: true })
  caption: string; // 사진 설명/캡션

  @Column({ type: 'text', nullable: true })
  description: string; // 상세 설명

  @Column({ type: 'int', nullable: true, name: 'display_order' })
  displayOrder: number; // 표시 순서

  @Column({ default: true, name: 'is_active' })
  isActive: boolean; // 활성화 여부

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
