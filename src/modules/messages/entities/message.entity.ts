import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ChatRoom } from './chat-room.entity';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  roomId: string;

  @ManyToOne(() => ChatRoom, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomId' })
  room: ChatRoom;

  @Column({ type: 'uuid' })
  senderId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({ type: 'uuid', nullable: true })
  receiverId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'receiverId' })
  receiver: User;

  // 메시지 내용
  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  messageType: MessageType;

  @Column({ type: 'text', nullable: true })
  messageText: string; // 메시지 텍스트

  @Column({ nullable: true })
  attachmentUrl: string; // 첨부파일 URL

  @Column({ nullable: true })
  attachmentType: string; // 첨부파일 유형

  // 하위 호환성을 위한 필드
  @Column({ type: 'text', nullable: true })
  content: string; // 하위 호환성 유지

  // 상태
  @Column({ default: false })
  isRead: boolean; // 읽음 여부

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date; // 읽은 시각

  // 시스템 메시지 정보
  @Column({ nullable: true })
  systemEvent: string; // 시스템 이벤트 유형

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date; // 삭제 시각 (소프트 삭제)
}

