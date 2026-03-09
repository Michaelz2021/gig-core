import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Provider } from './provider.entity';

@Entity({ name: 'provider_trust_scores', synchronize: false })
export class ProviderTrustScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'provider_id', type: 'uuid' })
  providerId: string;

  @ManyToOne(() => Provider, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  provider: Provider;

  @Column({ name: 'provider_type', type: 'varchar', length: 20 })
  providerType: string;

  @Column({ name: 'p1_identity_score', default: 0 })
  p1IdentityScore: number;

  @Column({ name: 'p2_credential_score', default: 0 })
  p2CredentialScore: number;

  @Column({ name: 'p3_profile_score', default: 0 })
  p3ProfileScore: number;

  @Column({ name: 'p4_transaction_score', default: 0 })
  p4TransactionScore: number;

  @Column({ name: 'p5_communication_score', default: 0 })
  p5CommunicationScore: number;

  @Column({ name: 'p6_reward_score', default: 0 })
  p6RewardScore: number;

  @Column({ name: 'last_calculated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastCalculatedAt: Date;

  // total_score is GENERATED in DB - do not insert/update
  @Column({ name: 'total_score', insert: false, update: false, nullable: true })
  totalScore?: number;
}
