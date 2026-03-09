import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('consumer_provider_favorites')
export class ConsumerProviderFavorite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'consumer_id', type: 'uuid' })
  consumerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consumer_id' })
  consumer: User;

  @Column({ name: 'provider_id', type: 'uuid' })
  providerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  provider: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
