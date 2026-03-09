import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type ReactionType = 'like' | 'recommend';

@Entity('consumer_provider_reactions')
export class ConsumerProviderReaction {
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

  @Column({ name: 'booking_id', type: 'uuid', nullable: true })
  bookingId: string | null;

  @Column({ type: 'varchar', length: 20 })
  reaction: ReactionType;

  @Column({ name: 'is_public', default: true })
  isPublic: boolean;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
