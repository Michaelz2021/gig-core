import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('service_task_templates')
@Index(['serviceType'])
@Index(['serviceType', 'phase', 'taskSeq'], { unique: true })
export class ServiceTaskTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'service_type', type: 'varchar', length: 20 })
  serviceType: string;

  @Column({ type: 'int' })
  phase: number;

  @Column({ name: 'task_seq', type: 'int' })
  taskSeq: number;

  @Column({ name: 'task_code', type: 'varchar', length: 50 })
  taskCode: string;

  @Column({ name: 'task_label', type: 'text' })
  taskLabel: string;

  @Column({ type: 'varchar', length: 20 })
  actor: string;

  @Column({ name: 'is_auto', default: false })
  isAuto: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
