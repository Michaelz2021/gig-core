import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RewardCredit } from './entities/reward-credit.entity';
import { RewardCreditTransaction, RewardCreditTransactionType } from '../payments/entities/reward-credit-transaction.entity';

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(RewardCredit)
    private readonly rewardCreditRepository: Repository<RewardCredit>,
    @InjectRepository(RewardCreditTransaction)
    private readonly rewardCreditTransactionRepository: Repository<RewardCreditTransaction>,
  ) {}

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
    relatedAuctionId?: string,
    relatedBookingId?: string,
  ): Promise<RewardCreditTransaction> {
    if (credits <= 0) {
      throw new BadRequestException('Credits must be greater than 0');
    }

    // 리워드 크레딧 계정 가져오기 또는 생성
    const rewardCredit = await this.getOrCreateRewardCredit(userId);
    const creditsBefore = rewardCredit.balance;

    if (creditsBefore < credits) {
      throw new BadRequestException('Insufficient credits balance');
    }

    const creditsAfter = creditsBefore - credits;

    // 메인 테이블 잔액 업데이트
    rewardCredit.balance = creditsAfter;
    await this.rewardCreditRepository.save(rewardCredit);

    // 거래 내역 생성
    const transaction = this.rewardCreditTransactionRepository.create({
      userId,
      transactionType: RewardCreditTransactionType.SPENT,
      creditsChange: -credits, // 음수로 저장
      creditsBefore,
      creditsAfter,
      reason,
      description: description || `Spent ${credits} credits: ${reason}`,
      relatedAuctionId,
      relatedBookingId,
    });

    return await this.rewardCreditTransactionRepository.save(transaction);
  }
}

