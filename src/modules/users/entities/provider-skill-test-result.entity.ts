import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Provider } from './provider.entity';

@Entity('provider_skill_test_results')
export class ProviderSkillTestResult {
  @PrimaryColumn({ type: 'uuid', name: 'provider_id' })
  providerId: string;

  @PrimaryColumn({ type: 'varchar', length: 64, name: 'category' })
  category: string;

  @Column({ type: 'jsonb', default: [] })
  answers: Array<{ question_index: number; selected_option_index: number }>;

  @Column({ name: 'time_taken_seconds', type: 'int', default: 0 })
  timeTakenSeconds: number;

  @Column({ type: 'smallint', default: 0 })
  score: number;

  @Column({ type: 'boolean', default: false })
  passed: boolean;

  @Column({ name: 'correct_count', type: 'smallint', default: 0 })
  correctCount: number;

  @Column({ name: 'total_questions', type: 'smallint', default: 0 })
  totalQuestions: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Provider, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  provider: Provider;
}
