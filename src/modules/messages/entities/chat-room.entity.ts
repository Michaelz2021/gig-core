import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { Auction } from '../../matching/entities/auction.entity';

export enum ChatRoomType {
  DIRECT = 'direct',
  SUPPORT = 'support',
  MEDIATION = 'mediation',
}

export enum ChatRoomStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  BLOCKED = 'blocked',
}

@Entity('chat_rooms')
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ChatRoomType,
    default: ChatRoomType.DIRECT,
  })
  roomType: ChatRoomType;

  // 참여자
  @Column({ type: 'uuid', nullable: true })
  user1Id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user1Id' })
  user1: User;

  @Column({ type: 'uuid', nullable: true })
  user2Id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user2Id' })
  user2: User;

  // 관련 정보
  @Column({ type: 'uuid', nullable: true })
  relatedBookingId: string; // 관련 예약 ID

  @ManyToOne(() => Booking, { nullable: true })
  @JoinColumn({ name: 'relatedBookingId' })
  relatedBooking: Booking;

  @Column({ type: 'uuid', nullable: true })
  relatedAuctionId: string; // 관련 경매 ID

  @ManyToOne(() => Auction, { nullable: true })
  @JoinColumn({ name: 'relatedAuctionId' })
  relatedAuction: Auction;

  // 상태
  @Column({
    type: 'enum',
    enum: ChatRoomStatus,
    default: ChatRoomStatus.ACTIVE,
  })
  status: ChatRoomStatus;

  // 메타데이터
  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt: Date; // 마지막 메시지 시각

  @Column({ default: 0 })
  unreadCountUser1: number; // user1의 읽지 않은 메시지 수

  @Column({ default: 0 })
  unreadCountUser2: number; // user2의 읽지 않은 메시지 수

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

