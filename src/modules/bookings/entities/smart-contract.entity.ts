import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Booking } from './booking.entity';
import { User } from '../../users/entities/user.entity';
import { Provider } from '../../users/entities/provider.entity';
import { Auction } from '../../matching/entities/auction.entity';
import { AuctionBid } from '../../matching/entities/auction-bid.entity';

export enum SmartContractStatus {
  DRAFT = 'draft',
  PENDING_SIGNATURES = 'pending_signatures',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  TERMINATED = 'terminated',
  DISPUTED = 'disputed',
}

@Entity('smart_contracts')
@Index(['contractNumber'], { unique: true })
export class SmartContract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  contractNumber: string; // 계약 번호 (고유값)

  @Column({ type: 'uuid' })
  bookingId: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @Column({ type: 'uuid' })
  consumerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'consumerId' })
  consumer: User;

  @Column({ type: 'uuid' })
  providerId: string;

  @ManyToOne(() => Provider)
  @JoinColumn({ name: 'providerId' })
  provider: Provider;

  // Auction 관계 (auction 기반 계약인 경우)
  @Column({ name: 'auction_id', type: 'uuid', nullable: true })
  auctionId?: string;

  @ManyToOne(() => Auction, { nullable: true })
  @JoinColumn({ name: 'auction_id' })
  auction?: Auction;

  @Column({ name: 'auction_bid_id', type: 'uuid', nullable: true })
  auctionBidId?: string;

  @ManyToOne(() => AuctionBid, { nullable: true })
  @JoinColumn({ name: 'auction_bid_id' })
  auctionBid?: AuctionBid;

  // 계약 내용
  @Column({ type: 'jsonb', nullable: true })
  contractTerms: {
    scopeOfWork?: string;
    deliverables?: string[];
    timeline?: Record<string, any>;
    paymentTerms?: Record<string, any>;
    penalties?: Record<string, any>;
    terminationConditions?: Record<string, any>;
  }; // 계약 조건 (구조화된 데이터)

  @Column({ nullable: true })
  contractDocumentUrl: string; // 계약서 PDF URL

  @Column({ nullable: true })
  contractHash: string; // 블록체인 해시 (SHA-256)

  @Column({ nullable: true })
  blockchainTxId: string; // 블록체인 거래 ID

  // 서명 정보
  @Column({ type: 'text', nullable: true })
  consumerSignature: string; // 구매자 전자서명 (base64, 암호화 저장 필요)

  @Column({ type: 'timestamp', nullable: true })
  consumerSignedAt: Date; // 구매자 서명 시각

  @Column({ nullable: true })
  consumerIp: string; // 구매자 IP 주소

  @Column({ type: 'text', nullable: true })
  providerSignature: string; // 제공자 전자서명 (base64, 암호화 저장 필요)

  @Column({ type: 'timestamp', nullable: true })
  providerSignedAt: Date; // 제공자 서명 시각

  @Column({ nullable: true })
  providerIp: string; // 제공자 IP 주소

  // 상태
  @Column({
    type: 'enum',
    enum: SmartContractStatus,
    default: SmartContractStatus.DRAFT,
  })
  status: SmartContractStatus;

  // 이행 정보
  @Column({ type: 'jsonb', nullable: true })
  completionProof: {
    photos?: string[];
    signatures?: string[];
    documents?: string[];
  }; // 완료 증빙 (사진, 서명 등)

  @Column({ type: 'timestamp', nullable: true })
  completionConfirmedAt: Date; // 완료 확인 시각

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

