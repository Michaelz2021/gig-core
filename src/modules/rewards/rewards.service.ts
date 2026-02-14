import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Xendit from 'xendit-node';
import { RewardCredit } from './entities/reward-credit.entity';
import { RewardCreditTransaction, RewardCreditTransactionType } from '../payments/entities/reward-credit-transaction.entity';
import { RewardPaymentSession } from '../payments/entities/reward-payment-session.entity';
import { BookingsService } from '../bookings/bookings.service';
import { XENDIT_PAYMENT_METHODS, XenditChannelConfig } from '../../config/xendit-payment-methods.config';
import { RewardBuyRequestDto } from './dto/reward-buy-request.dto';

/** 리워드 결제 초기화 응답과 동일한 형식으로 사용 (5개 전부 반환) */
const REWARD_AVAILABLE_METHODS = [
  { method_type: 'CARD', display_name: 'Credit/Debit Card', fee: '2.5%', processing_time: 'Instant' },
  { method_type: 'GCASH', display_name: 'GCash', fee: 'Free', processing_time: 'Instant' },
  { method_type: 'PAYMAYA', display_name: 'PayMaya', fee: 'Free', processing_time: 'Instant' },
  { method_type: 'QRPH', display_name: 'QR.ph', fee: 'Free', processing_time: 'Instant' },
  { method_type: 'INSTAPAY', display_name: 'InstaPay Bank Transfer', fee: '₱10', processing_time: 'Real-time' },
] as const;

@Injectable()
export class RewardsService {
  private xendit: any;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(RewardCredit)
    private readonly rewardCreditRepository: Repository<RewardCredit>,
    @InjectRepository(RewardCreditTransaction)
    private readonly rewardCreditTransactionRepository: Repository<RewardCreditTransaction>,
    @InjectRepository(RewardPaymentSession)
    private readonly rewardPaymentSessionRepository: Repository<RewardPaymentSession>,
    private readonly bookingsService: BookingsService,
  ) {
    this.xendit = new Xendit({
      secretKey: this.configService.get('XENDIT_SECRET_KEY') || '',
    });
  }

  /**
   * 사용자의 리워드 크레딧 계정을 가져오거나 생성
   */
  private async getOrCreateRewardCredit(userId: string): Promise<RewardCredit> {
    let rewardCredit = await this.rewardCreditRepository.findOne({ where: { userId } });

    if (!rewardCredit) {
      rewardCredit = this.rewardCreditRepository.create({
        userId,
        balance: 0,
      });
      rewardCredit = await this.rewardCreditRepository.save(rewardCredit);
    }

    return rewardCredit;
  }

  /**
   * 사용자의 현재 리워드 크레딧 잔액 조회
   */
  async getBalance(userId: string): Promise<{ balance: number }> {
    const rewardCredit = await this.getOrCreateRewardCredit(userId);
    return { balance: rewardCredit.balance };
  }

  /**
   * 사용자의 리워드 크레딧 거래 내역 조회
   */
  async getTransactions(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    items: RewardCreditTransaction[];
    total: number;
    page: number;
    limit: number;
  }> {
    const offset = (page - 1) * limit;
    const maxLimit = Math.min(limit, 100); // 최대 100개로 제한

    const [items, total] = await this.rewardCreditTransactionRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: offset,
      take: maxLimit,
    });

    return {
      items,
      total,
      page,
      limit: maxLimit,
    };
  }

  /**
   * 리워드 크레딧 구매 결제 세션 초기화 (booking 결제 initialize와 동일한 응답 형식).
   * payment_session_id는 임의 생성. 이후 Xendit 연동 시 교체.
   */
  async initializeRewardPurchase(
    userId: string,
    credits: number,
    reason?: string,
    description?: string,
  ): Promise<{
    payment_session_id: string;
    bookingId: null;
    amount: number;
    breakdown: { service_cost: number; platform_fee: number; insurance: number };
    available_methods: Array<{
      method_type: string;
      display_name: string;
      fee: string;
      processing_time: string;
    }>;
    expires_at: string;
  }> {
    if (credits <= 0) {
      throw new BadRequestException('Credits must be greater than 0');
    }

    const serviceCost = Number(credits);
    const platformFee = Math.round(credits * 0.04 * 100) / 100;
    const totalAmount = Math.round((serviceCost + platformFee) * 100) / 100;
    const sessionId = `PSESS-REWARD-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const session = this.rewardPaymentSessionRepository.create({
      session_id: sessionId,
      userId,
      credits,
      total_amount: totalAmount,
      service_amount: serviceCost,
      platform_fee: platformFee,
      status: 'PENDING',
      reason: reason ?? null,
      description: description ?? null,
      expires_at: expiresAt,
    });
    try {
      await this.rewardPaymentSessionRepository.save(session);
    } catch (err: any) {
      if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
        throw new BadRequestException(
          'reward_payment_sessions table is missing. Run migration or create the table.',
        );
      }
      throw err;
    }

    return {
      payment_session_id: sessionId,
      bookingId: null,
      amount: totalAmount,
      breakdown: {
        service_cost: serviceCost,
        platform_fee: platformFee,
        insurance: 0,
      },
      available_methods: [...REWARD_AVAILABLE_METHODS],
      expires_at: expiresAt.toISOString(),
    };
  }

  /**
   * 리워드 결제 요청: Xendit으로 결제 생성, reward_payment_sessions 업데이트.
   * 결제 성공 시 웹훅에서 addCreditsFromPayment 호출로 reward_credits·reward_credit_transactions 반영.
   */
  async rewardBuyRequest(
    userId: string,
    dto: RewardBuyRequestDto,
  ): Promise<{
    xendit_payment_id: string;
    payment_url: string;
    qr_code: string;
    redirect_required: boolean;
    expires_at: string;
  }> {
    const session = await this.rewardPaymentSessionRepository.findOne({
      where: { session_id: dto.payment_session_id },
    });
    if (!session) {
      throw new BadRequestException('Payment session not found');
    }
    if (session.userId !== userId) {
      throw new BadRequestException('Access denied to this payment session');
    }
    if (session.status === 'PAID') {
      throw new BadRequestException('Payment already completed');
    }
    if (session.expires_at && session.expires_at < new Date()) {
      throw new BadRequestException('Payment session expired');
    }

    const methodConfig = XENDIT_PAYMENT_METHODS[dto.payment_method] as XenditChannelConfig | undefined;
    if (!methodConfig) {
      throw new BadRequestException(`Unsupported payment method: ${dto.payment_method}`);
    }
    if (methodConfig.requires_card_details && !dto.card_details) {
      throw new BadRequestException('Card details are required for card payments');
    }

    const channelProperties = methodConfig.channel_properties({
      return_url: dto.return_url,
      card_details: dto.card_details,
      cardholder_name: '',
    });

    const referenceId = `GIG-REWARD-${session.session_id}-${Date.now()}`;
    const xenditRequest = {
      reference_id: referenceId,
      type: 'PAY',
      country: 'PH',
      currency: 'PHP',
      channel_code: methodConfig.channel_code,
      request_amount: Number(session.total_amount),
      capture_method: 'AUTOMATIC',
      customer: {
        type: 'INDIVIDUAL',
        reference_id: session.userId,
        email: '',
        mobile_number: '',
      },
      metadata: {
        payment_session_id: dto.payment_session_id,
        type: 'reward',
        platform: 'gig-market',
        environment: process.env.NODE_ENV || 'development',
      },
      description: session.description || `Gig-Market reward credits - ${session.credits} credits`,
      channel_properties: channelProperties,
    };

    let xenditResponse: any;
    try {
      // xendit-node v7: createPaymentRequest({ data: params })
      xenditResponse = await this.xendit.PaymentRequest.createPaymentRequest({ data: xenditRequest });
    } catch (err: any) {
      throw new BadRequestException(`Xendit payment creation failed: ${err?.message || err}`);
    }

    const paymentUrl =
      xenditResponse.actions?.find((a: any) => a.action === 'AUTH' || a.action === 'VIEW')?.url || null;
    const qrCode =
      xenditResponse.actions?.find((a: any) => a.action === 'QR_CHECKOUT')?.qr_code || null;
    const expiresAt = xenditResponse.actions?.[0]?.expires_at || null;

    session.xenditPaymentId = xenditResponse.id;
    session.xenditPaymentRequestId = xenditResponse.payment_request_id;
    session.paymentMethod = dto.payment_method;
    session.channelCode = methodConfig.channel_code;
    session.paymentUrl = paymentUrl ?? undefined;
    session.qrCode = qrCode ?? undefined;
    session.status = 'PROCESSING';
    await this.rewardPaymentSessionRepository.save(session);

    return {
      xendit_payment_id: xenditResponse.id,
      payment_url: paymentUrl ?? '',
      qr_code: qrCode ?? '',
      redirect_required: methodConfig.requires_redirect,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : new Date().toISOString(),
    };
  }

  /**
   * 웹훅에서 결제 성공 시 호출: reward_credits 잔액 증가 + reward_credit_transactions 기록.
   */
  async addCreditsFromPayment(paymentSessionId: string): Promise<void> {
    const session = await this.rewardPaymentSessionRepository.findOne({
      where: { session_id: paymentSessionId },
    });
    if (!session || session.status === 'PAID') {
      return;
    }
    const userId = session.userId;
    const credits = session.credits;
    const reason = session.reason || 'Credit purchase';
    const description = session.description || `Purchased ${credits} credits`;

    const rewardCredit = await this.getOrCreateRewardCredit(userId);
    const creditsBefore = rewardCredit.balance;
    const creditsAfter = creditsBefore + credits;

    rewardCredit.balance = creditsAfter;
    await this.rewardCreditRepository.save(rewardCredit);

    const transaction = this.rewardCreditTransactionRepository.create({
      userId,
      transactionType: RewardCreditTransactionType.PURCHASED,
      creditsChange: credits,
      creditsBefore,
      creditsAfter,
      reason,
      description,
    });
    await this.rewardCreditTransactionRepository.save(transaction);

    session.status = 'PAID';
    session.paidAt = new Date();
    await this.rewardPaymentSessionRepository.save(session);
  }

  /**
   * 리워드 크레딧 구매
   */
  async buyCredits(
    userId: string,
    credits: number,
    reason?: string,
    description?: string,
  ): Promise<RewardCreditTransaction> {
    if (credits <= 0) {
      throw new BadRequestException('Credits must be greater than 0');
    }

    // 리워드 크레딧 계정 가져오기 또는 생성
    const rewardCredit = await this.getOrCreateRewardCredit(userId);
    const creditsBefore = rewardCredit.balance;
    const creditsAfter = creditsBefore + credits;

    // 메인 테이블 잔액 업데이트
    rewardCredit.balance = creditsAfter;
    await this.rewardCreditRepository.save(rewardCredit);

    // 거래 내역 생성
    const transaction = this.rewardCreditTransactionRepository.create({
      userId,
      transactionType: RewardCreditTransactionType.PURCHASED,
      creditsChange: credits,
      creditsBefore,
      creditsAfter,
      reason: reason || 'Credit purchase',
      description: description || `Purchased ${credits} credits`,
    });

    return await this.rewardCreditTransactionRepository.save(transaction);
  }

  /**
   * 리워드 크레딧 사용
   */
  async spendCredits(
    userId: string,
    credits: number,
    reason: string,
    description?: string,
    relatedBookingNumber?: string,
  ): Promise<RewardCreditTransaction> {
    if (credits <= 0) {
      throw new BadRequestException('Credits must be greater than 0');
    }

    // 관련 booking_number 가 있으면 UUID id 로 변환 + provider 정보 조회 (service reward 전용)
    let relatedBookingId: string | undefined;
    let providerUserId: string | undefined;
    if (relatedBookingNumber) {
      const booking = await this.bookingsService.findOneByBookingNumber(relatedBookingNumber);
      relatedBookingId = booking.id;
      // bookings.providerId 는 providers.userId 를 가리키므로, 곧 provider의 userId
      providerUserId = booking.providerId;
    }

    // 기본: 크레딧 차감 대상(요청자)의 계정
    const spenderCredit = await this.getOrCreateRewardCredit(userId);
    const spenderBefore = spenderCredit.balance;

    if (spenderBefore < credits) {
      throw new BadRequestException('Insufficient credits balance');
    }

    const spenderAfter = spenderBefore - credits;
    spenderCredit.balance = spenderAfter;
    await this.rewardCreditRepository.save(spenderCredit);

    // 1) 일반 사용 (service reward 가 아닌 경우): 단순 차감 + SPENT 트랜잭션 1건
    if (reason !== 'service reward' || !providerUserId) {
      const transaction = this.rewardCreditTransactionRepository.create({
        userId,
        transactionType: RewardCreditTransactionType.SPENT,
        creditsChange: -credits,
        creditsBefore: spenderBefore,
        creditsAfter: spenderAfter,
        reason,
        description: description || `Spent ${credits} credits: ${reason}`,
        relatedAuctionId: null,
        relatedBookingId: relatedBookingId ?? null,
      });

      return await this.rewardCreditTransactionRepository.save(transaction);
    }

    // 2) service reward: 요청자 → 서비스 제공자에게 크레딧 이전
    //    - 요청자: SPENT (음수)
    //    - 제공자: EARNED (양수)

    // 서비스 제공자 리워드 계정
    const providerCredit = await this.getOrCreateRewardCredit(providerUserId);
    const providerBefore = providerCredit.balance;
    const providerAfter = providerBefore + credits;
    providerCredit.balance = providerAfter;
    await this.rewardCreditRepository.save(providerCredit);

    // 요청자 쪽 트랜잭션 (SPENT)
    const spenderTx = this.rewardCreditTransactionRepository.create({
      userId,
      transactionType: RewardCreditTransactionType.SPENT,
      creditsChange: -credits,
      creditsBefore: spenderBefore,
      creditsAfter: spenderAfter,
      reason,
      description: description || `Spent ${credits} credits: ${reason}`,
      relatedAuctionId: null,
      relatedBookingId: relatedBookingId ?? null,
    });

    // 제공자 쪽 트랜잭션 (EARNED)
    const providerTx = this.rewardCreditTransactionRepository.create({
      userId: providerUserId,
      transactionType: RewardCreditTransactionType.EARNED,
      creditsChange: credits,
      creditsBefore: providerBefore,
      creditsAfter: providerAfter,
      reason: 'service reward',
      description:
        description ||
        `Earned ${credits} credits from service reward (booking: ${relatedBookingNumber ?? relatedBookingId})`,
      relatedAuctionId: null,
      relatedBookingId: relatedBookingId ?? null,
    });

    await this.rewardCreditTransactionRepository.save(providerTx);
    return await this.rewardCreditTransactionRepository.save(spenderTx);
  }
}

