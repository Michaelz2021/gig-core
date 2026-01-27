import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { User } from '../../users/entities/user.entity';

export enum ReviewType {
  PROVIDER_TO_CONSUMER = 'provider_to_consumer',
  CONSUMER_TO_PROVIDER = 'consumer_to_provider',
}

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId: string;

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'reviewer_id', type: 'uuid' })
  reviewerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @Column({ name: 'reviewee_id', type: 'uuid' })
  revieweeId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewee_id' })
  reviewee: User;

  @Column({
    name: 'reviewer_type',
    type: 'enum',
    enum: ReviewType,
  })
  reviewType: ReviewType;

  // 평가 점수
  @Column({ name: 'rating', type: 'integer' })
  rating: number; // 전체 평점 (1-5점)

  @Column({ name: 'quality_rating', type: 'integer', nullable: true })
  qualityRating: number; // 품질 평점 (1-5점)

  @Column({ name: 'communication_rating', type: 'integer', nullable: true })
  communicationRating: number; // 의사소통 평점 (1-5점)

  @Column({ name: 'punctuality_rating', type: 'integer', nullable: true })
  punctualityRating: number; // 시간 준수 평점 (1-5점)

  @Column({ name: 'professionalism_rating', type: 'integer', nullable: true })
  professionalismRating: number; // 전문성 평점 (1-5점)

  // 리뷰 내용
  @Column({ name: 'review_text', type: 'text', nullable: true })
  reviewText: string; // 리뷰 내용

  @Column({ name: 'photo_urls', type: 'jsonb', nullable: true })
  photos: string[]; // 리뷰 사진 URL 배열

  // 응답
  @Column({ name: 'provider_response', type: 'text', nullable: true })
  responseText: string; // 제공자 응답

  @Column({ name: 'responded_at', type: 'timestamp', nullable: true })
  responseDate: Date; // 응답 날짜

  // 상태
  @Column({ name: 'is_verified', default: true })
  isVerified: boolean; // 검증된 리뷰 여부

  @Column({ name: 'is_visible', default: true })
  isVisible: boolean; // 표시 여부

  @Column({ name: 'is_flagged', default: false })
  isFlagged: boolean; // 신고된 리뷰 여부

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

