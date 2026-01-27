import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum NoticeType {
  NOTICE = 'notice', // 공지사항
  NEWS = 'news', // 뉴스
}

@Entity('notices')
@Index(['type', 'isActive', 'createdAt'])
export class Notice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NoticeType,
  })
  type: NoticeType; // 공지사항 또는 뉴스

  @Column()
  title: string; // 제목

  @Column({ type: 'text' })
  content: string; // 내용

  @Column({ type: 'text', nullable: true })
  summary: string; // 요약 (선택사항)

  @Column({ type: 'jsonb', nullable: true })
  images: string[]; // 이미지 URL 배열

  @Column({ default: true })
  isActive: boolean; // 활성화 여부

  @Column({ type: 'int', default: 0 })
  viewCount: number; // 조회수

  @Column({ type: 'uuid', nullable: true })
  createdBy: string; // 작성자 ID (관리자)

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date; // 발행일 (선택사항)

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
