import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus, PaymentMethod } from './entities/payment.entity';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { Escrow, EscrowStatus } from './entities/escrow.entity';
import { Wallet, WalletStatus } from './entities/wallet.entity';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { WalletTopupDto } from './dto/wallet-topup.dto';
import { BookingsService } from '../bookings/bookings.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Escrow)
    private readonly escrowRepository: Repository<Escrow>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    private readonly bookingsService: BookingsService,
    private readonly usersService: UsersService,
  ) {}

  private async createWalletTransaction(input: {
    walletId: string;
    userId: string;
    type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'earning' | 'fee' | 'escrow_hold' | 'escrow_release';
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    description?: string;
    relatedBookingId?: string;
    paymentMethod?: string;
  }) {
    await this.walletRepository.manager.query(
      `
      INSERT INTO wallet_transactions (
        wallet_id,
        user_id,
        type,
        amount,
        balance_before,
        balance_after,
        description,
        related_booking_id,
        payment_method
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        input.walletId,
        input.userId,
        input.type,
        input.amount,
        input.balanceBefore,
        input.balanceAfter,
        input.description || null,
        input.relatedBookingId || null,
        input.paymentMethod || null,
      ],
    );
  }

  async processPayment(userId: string, processPaymentDto: ProcessPaymentDto): Promise<Payment> {
    const booking = await this.bookingsService.findOne(processPaymentDto.bookingId);

    if (booking.consumerId !== userId) {
      throw new BadRequestException('You can only pay for your own bookings');
    }

    if (booking.status !== 'confirmed') {
      throw new BadRequestException('Booking must be confirmed before payment');
    }

    if (processPaymentDto.paymentMethod === PaymentMethod.WALLET) {
      const consumerWallet = await this.getOrCreateWallet(userId);
      const providerWallet = await this.getOrCreateWallet(booking.providerId);

      const consumerBalanceBefore = Number(consumerWallet.balance || 0);
      const providerBalanceBefore = Number(providerWallet.balance || 0);

      if (consumerBalanceBefore < processPaymentDto.amount) {
        throw new BadRequestException('Insufficient wallet balance');
      }
      
      // Deduct from consumer wallet
      consumerWallet.balance = consumerBalanceBefore - Number(processPaymentDto.amount);
      await this.walletRepository.save(consumerWallet);

      // Add to provider wallet
      providerWallet.balance = providerBalanceBefore + Number(processPaymentDto.amount);
      await this.walletRepository.save(providerWallet);

      // 기록용 거래 내역 (payment 타입으로 생성)
      await this.createWalletTransaction({
        walletId: consumerWallet.id,
        userId,
        type: 'payment',
        amount: Number(processPaymentDto.amount),
        balanceBefore: consumerBalanceBefore,
        balanceAfter: Number(consumerWallet.balance),
        description: `Payment for booking ${booking.id}`,
        relatedBookingId: booking.id,
      });

      await this.createWalletTransaction({
        walletId: providerWallet.id,
        userId: booking.providerId,
        type: 'payment',
        amount: Number(processPaymentDto.amount),
        balanceBefore: providerBalanceBefore,
        balanceAfter: Number(providerWallet.balance),
        description: `Payment received for booking ${booking.id}`,
        relatedBookingId: booking.id,
      });
    }

    const payment = this.paymentRepository.create({
      ...processPaymentDto,
      userId,
      status: PaymentStatus.COMPLETED,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Auction 기반 Booking인 경우 SmartContract 자동 생성
    if (booking.auctionId && booking.auctionBidId) {
      try {
        await this.bookingsService.createSmartContractFromAuction(booking.id);
      } catch (error) {
        // SmartContract 생성 실패는 로그만 남기고 결제는 성공 처리
        console.error(`Failed to create smart contract for booking ${booking.id}:`, error.message);
      }
    }

    return savedPayment;
  }

  private async getOrCreateWallet(userId: string): Promise<Wallet> {
    // available_balance는 GENERATED COLUMN이므로 raw query로 명시적으로 SELECT
    const walletData = await this.walletRepository.manager.query(
      `
      SELECT 
        id,
        user_id as "userId",
        balance,
        escrow_balance as "escrowBalance",
        available_balance as "availableBalance",
        currency,
        status,
        daily_limit as "dailyLimit",
        monthly_limit as "monthlyLimit",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM wallets
      WHERE user_id = $1
      `,
      [userId],
    );

    let wallet: Wallet;

    if (walletData && walletData.length > 0) {
      // 기존 지갑이 있는 경우
      const data = walletData[0];
      // NaN 체크 및 0으로 변환
      let balance = parseFloat(String(data.balance || 0));
      if (isNaN(balance)) {
        balance = 0;
      }
      let escrowBalance = parseFloat(String(data.escrowBalance || 0));
      if (isNaN(escrowBalance)) {
        escrowBalance = 0;
      }
      let availableBalance = parseFloat(String(data.availableBalance || 0));
      if (isNaN(availableBalance)) {
        availableBalance = balance - escrowBalance;
      }
      
      wallet = this.walletRepository.create({
        id: data.id,
        userId: data.userId,
        balance,
        escrowBalance,
        availableBalance,
        currency: data.currency || 'PHP',
        status: data.status || WalletStatus.ACTIVE,
        dailyLimit: parseFloat(String(data.dailyLimit || 50000)),
        monthlyLimit: parseFloat(String(data.monthlyLimit || 500000)),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    } else {
      // 지갑이 없는 경우 생성
      wallet = this.walletRepository.create({
        userId,
        balance: 0,
        escrowBalance: 0,
        currency: 'PHP',
        status: WalletStatus.ACTIVE,
        dailyLimit: 50000,
        monthlyLimit: 500000,
      });
      wallet = await this.walletRepository.save(wallet);
      // 저장 후 다시 조회하여 available_balance 포함
      const savedWalletData = await this.walletRepository.manager.query(
        `
        SELECT 
          id,
          user_id as "userId",
          balance,
          escrow_balance as "escrowBalance",
          available_balance as "availableBalance",
          currency,
          status,
          daily_limit as "dailyLimit",
          monthly_limit as "monthlyLimit",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM wallets
        WHERE id = $1
        `,
        [wallet.id],
      );
      if (savedWalletData && savedWalletData.length > 0) {
        const data = savedWalletData[0];
        wallet.availableBalance = parseFloat(String(data.availableBalance || 0));
      }
    }

    return wallet;
  }

  async getWallet(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    const balance = Number(wallet.balance || 0);
    const escrowBalance = Number(wallet.escrowBalance || 0);
    // availableBalance는 GENERATED COLUMN이므로 DB에서 자동 계산됨
    // TypeORM이 읽지 못할 경우 수동 계산
    let availableBalance = wallet.availableBalance 
      ? Number(wallet.availableBalance) 
      : (balance - escrowBalance);
    
    // availableBalance가 없거나 0인 경우 수동 계산
    if (!wallet.availableBalance || availableBalance === 0) {
      availableBalance = balance - escrowBalance;
    }
    
    // 디버깅 로그 (개발 환경에서만)
    console.log(`[getWallet] userId: ${userId}, balance: ${balance}, escrowBalance: ${escrowBalance}, availableBalance: ${availableBalance}`);
    
    // NaN 체크
    return { 
      balance: isNaN(balance) ? 0 : balance,              // 총 잔액
      escrowBalance: isNaN(escrowBalance) ? 0 : escrowBalance,        // 에스크로 잔액
      availableBalance: isNaN(availableBalance) ? 0 : availableBalance,     // 사용 가능 잔액 (balance - escrow_balance)
    };
  }

  async getWalletTransactions(userId: string) {
    // wallet_transactions 테이블에서 해당 사용자 지갑 거래 내역 조회
    const rows = await this.walletRepository.manager.query(
      `
      SELECT
        id,
        wallet_id    AS "walletId",
        user_id      AS "userId",
        type,
        amount,
        currency,
        balance_before AS "balanceBefore",
        balance_after  AS "balanceAfter",
        description,
        status,
        created_at  AS "createdAt"
      FROM wallet_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
      `,
      [userId],
    );

    return {
      items: rows,
      total: rows.length,
    };
  }

  async getWalletUserTransactions(userId: string, page: number = 1, limit: number = 20) {
    // 페이지네이션 계산
    const offset = (page - 1) * limit;
    const maxLimit = Math.min(limit, 100); // 최대 100개로 제한

    // 총 개수 조회
    const totalResult = await this.walletRepository.manager.query(`
      SELECT COUNT(*) as count
      FROM wallet_transactions wt
      WHERE wt.user_id = $1
    `, [userId]);
    const total = parseInt(totalResult[0]?.count || '0', 10);

    // 거래 내역 조회 (페이징 적용)
    const transactions = await this.walletRepository.manager.query(`
      SELECT 
        wt.id,
        wt.wallet_id as "walletId",
        wt.user_id as "userId",
        wt.type,
        wt.amount,
        wt.currency,
        wt.balance_before as "balanceBefore",
        wt.balance_after as "balanceAfter",
        wt.related_transaction_id as "relatedTransactionId",
        wt.related_booking_id as "relatedBookingId",
        wt.status,
        wt.description,
        wt.payment_method as "paymentMethod",
        wt.created_at as "createdAt"
      FROM wallet_transactions wt
      WHERE wt.user_id = $1
      ORDER BY wt.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, maxLimit, offset]);

    const formattedTransactions = transactions.map((txn: any) => ({
      id: txn.id,
      walletId: txn.walletId,
      userId: txn.userId,
      type: txn.type,
      amount: parseFloat(String(txn.amount || 0)),
      currency: txn.currency || 'PHP',
      balanceBefore: parseFloat(String(txn.balanceBefore || 0)),
      balanceAfter: parseFloat(String(txn.balanceAfter || 0)),
      relatedTransactionId: txn.relatedTransactionId,
      relatedBookingId: txn.relatedBookingId,
      status: txn.status,
      description: txn.description,
      paymentMethod: txn.paymentMethod,
      createdAt: txn.createdAt,
    }));

    return {
      items: formattedTransactions,
      total: total, // 실제 총 개수 반환
      page: page,
      limit: maxLimit,
    };
  }

  async topup(userId: string, topupDto: WalletTopupDto) {
    if (topupDto.amount <= 0) {
      throw new BadRequestException('Top-up amount must be greater than 0');
    }

    const wallet = await this.getOrCreateWallet(userId);
    // NaN 체크 및 0으로 변환
    let balanceBefore = Number(wallet.balance || 0);
    if (isNaN(balanceBefore)) {
      balanceBefore = 0;
    }
    const amount = Number(topupDto.amount);

    // balance 업데이트 (NaN 방지)
    const newBalance = balanceBefore + amount;
    if (isNaN(newBalance)) {
      throw new BadRequestException('Invalid balance calculation');
    }

    // Raw SQL로 직접 업데이트하여 NaN 문제 방지
    await this.walletRepository.manager.query(
      `
      UPDATE wallets
      SET balance = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
      `,
      [newBalance, userId],
    );

    // 업데이트된 지갑 다시 조회
    const savedWallet = await this.getOrCreateWallet(userId);
    const balanceAfter = Number(savedWallet.balance || 0);

    await this.createWalletTransaction({
      walletId: savedWallet.id,
      userId,
      type: 'deposit',
      amount,
      balanceBefore,
      balanceAfter: isNaN(balanceAfter) ? newBalance : balanceAfter,
      description: 'Wallet top-up',
    });

    return { balance: isNaN(balanceAfter) ? newBalance : balanceAfter, message: 'Top-up successful' };
  }

  async withdraw(userId: string, withdrawDto: {
    amount: number;
    withdrawalMethod?: string;
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
    eWalletAccount?: string;
    description?: string;
  }) {
    const { amount, withdrawalMethod, bankName, accountNumber, accountHolderName, eWalletAccount, description } = withdrawDto;

    // 금액 검증
    if (!amount || amount <= 0) {
      return {
        success: false,
        reason: 'INVALID_AMOUNT',
        message: '출금 금액은 0보다 커야 합니다.',
      };
    }

    // 출금 대상 정보 검증
    if (withdrawalMethod === 'bank_transfer') {
      if (!bankName || !accountNumber || !accountHolderName) {
        return {
          success: false,
          reason: 'INVALID_WITHDRAWAL_INFO',
          message: '은행 계좌 출금 시 은행명, 계좌번호, 예금주명이 필요합니다.',
        };
      }
    } else if (withdrawalMethod === 'e_wallet') {
      if (!eWalletAccount) {
        return {
          success: false,
          reason: 'INVALID_WITHDRAWAL_INFO',
          message: 'E-Wallet 출금 시 계정 정보가 필요합니다.',
        };
      }
    }

    try {
      const wallet = await this.getOrCreateWallet(userId);
      const balanceBefore = Number(wallet.balance || 0);

      // 잔액 부족 확인
      if (balanceBefore < amount) {
        return {
          success: false,
          reason: 'INSUFFICIENT_BALANCE',
          message: `잔액이 부족합니다. 현재 잔액: ${balanceBefore.toFixed(2)} PHP`,
          balance: balanceBefore,
        };
      }

      // 출금 처리
      wallet.balance = balanceBefore - amount;
      const savedWallet = await this.walletRepository.save(wallet);

      // 출금 설명 생성
      let withdrawalDescription = description || 'Wallet withdrawal';
      if (withdrawalMethod === 'bank_transfer' && bankName && accountNumber) {
        withdrawalDescription = `${withdrawalDescription} - ${bankName} ${accountNumber}`;
      } else if (withdrawalMethod === 'e_wallet' && eWalletAccount) {
        withdrawalDescription = `${withdrawalDescription} - ${eWalletAccount}`;
      }

      // 거래 내역 기록
      await this.createWalletTransaction({
        walletId: savedWallet.id,
        userId,
        type: 'withdrawal',
        amount: Number(amount),
        balanceBefore,
        balanceAfter: Number(savedWallet.balance),
        description: withdrawalDescription,
      });

      return {
        success: true,
        balance: Number(savedWallet.balance),
        message: '출금이 성공적으로 처리되었습니다.',
      };
    } catch (error) {
      // 출금 실패 처리
      console.error(`Withdrawal failed for user ${userId}:`, error);
      return {
        success: false,
        reason: 'WITHDRAWAL_FAILED',
        message: '출금 처리 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }

  // Transactions APIs
  async findAllTransactions(userId?: string, bookingId?: string, status?: string, type?: string, page = 1, limit = 20) {
    const where: any = {};
    if (userId) {
      if (type === 'CLIENT') {
        where.consumerId = userId;
      } else if (type === 'PROVIDER') {
        where.providerId = userId;
      } else {
        // Both
        where.consumerId = userId;
        // Also include transactions where user is provider
      }
    }
    if (bookingId) {
      where.bookingId = bookingId;
    }
    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;
    const [items, total] = await this.transactionRepository.findAndCount({
      where: bookingId ? { bookingId } : userId && type ? 
        (type === 'CLIENT' ? { consumerId: userId } : { providerId: userId }) :
        userId ? [
          { consumerId: userId },
          { providerId: userId },
        ] : {},
      relations: ['booking', 'consumer', 'provider', 'escrow'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const transactions = items.map((txn: any) => ({
      transactionId: txn.id,
      serviceName: txn.booking?.service?.title || 'Service',
      providerName: txn.provider ? `${txn.provider.user?.firstName || ''} ${txn.provider.user?.lastName || ''}` : '',
      clientName: txn.consumer ? `${txn.consumer.firstName} ${txn.consumer.lastName}` : '',
      status: txn.status,
      totalAmount: txn.amount,
      escrowAmount: txn.escrow?.escrowAmount || txn.amount,
      completedAmount: txn.escrow?.releasedAmount || 0,
      startDate: txn.booking?.scheduledDate,
      expectedCompletion: txn.booking?.actualEndTime,
      milestones: [], // TODO: Get from booking milestones
      createdAt: txn.createdAt,
    }));

    return {
      transactions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async findOneTransaction(id: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['booking', 'consumer', 'provider', 'escrow', 'booking.service'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return {
      transactionId: transaction.id,
      serviceName: transaction.booking?.service?.title || 'Service',
      providerName: transaction.provider ? `${transaction.provider.user?.firstName || ''} ${transaction.provider.user?.lastName || ''}` : '',
      clientName: transaction.consumer ? `${transaction.consumer.firstName} ${transaction.consumer.lastName}` : '',
      status: transaction.status,
      totalAmount: transaction.amount,
      escrowAmount: transaction.escrow?.escrowAmount || transaction.amount,
      completedAmount: transaction.escrow?.releasedAmount || 0,
      startDate: transaction.booking?.scheduledDate,
      expectedCompletion: transaction.booking?.actualEndTime,
      description: transaction.booking?.service?.description || '',
      milestones: [], // TODO: Get from booking milestones
      chatId: transaction.bookingId, // Use booking ID as chat ID reference
      createdAt: transaction.createdAt,
    };
  }

  // Escrows APIs
  async findAllEscrows(userId?: string, bookingId?: string) {
    const where: any = {};
    if (userId) {
      where.consumerId = userId;
      // Also include escrows where user is provider
    }
    if (bookingId) {
      where.bookingId = bookingId;
    }

    const [items, total] = await this.escrowRepository.findAndCount({
      where: bookingId ? { bookingId } : userId ? [
        { consumerId: userId },
        { providerId: userId },
      ] : {},
      relations: ['booking', 'consumer', 'provider', 'dispute'],
      order: { createdAt: 'DESC' },
    });

    return { items, total };
  }

  async findOneEscrow(id: string): Promise<Escrow> {
    const escrow = await this.escrowRepository.findOne({
      where: { id },
      relations: ['booking', 'consumer', 'provider', 'dispute'],
    });

    if (!escrow) {
      throw new NotFoundException(`Escrow with ID ${id} not found`);
    }

    return escrow;
  }

  async releaseEscrow(escrowId: string, userId: string): Promise<Escrow> {
    const escrow = await this.findOneEscrow(escrowId);

    if (escrow.consumerId !== userId && escrow.providerId !== userId) {
      throw new BadRequestException('You are not authorized to release this escrow');
    }

    if (escrow.status !== EscrowStatus.HELD) {
      throw new BadRequestException('Escrow is not in held status');
    }

    escrow.status = EscrowStatus.RELEASED;
    escrow.releasedAmount = escrow.escrowAmount;
    escrow.releasedAt = new Date();

    // Transfer funds to provider wallet
    const providerWallet = await this.getOrCreateWallet(escrow.providerId);
    const balanceBefore = Number(providerWallet.balance || 0);
    const amount = Number(escrow.escrowAmount || 0);

    providerWallet.balance = balanceBefore + amount;
    const savedWallet = await this.walletRepository.save(providerWallet);

    await this.createWalletTransaction({
      walletId: savedWallet.id,
      userId: escrow.providerId,
      type: 'escrow_release',
      amount,
      balanceBefore,
      balanceAfter: Number(savedWallet.balance),
      description: `Escrow released for booking ${escrow.bookingId}`,
      relatedBookingId: escrow.bookingId,
    });

    return this.escrowRepository.save(escrow);
  }

  // Payment Methods API
  async getPaymentMethods() {
    return {
      methods: [
        {
          methodId: 'gcash',
          name: 'GCash',
          type: 'DIGITAL_WALLET',
          isEnabled: true,
          icon: 'https://api.aitrusttrade.com/icons/gcash.png',
        },
        {
          methodId: 'paymaya',
          name: 'PayMaya',
          type: 'DIGITAL_WALLET',
          isEnabled: true,
          icon: 'https://api.aitrusttrade.com/icons/paymaya.png',
        },
        {
          methodId: 'bank_transfer',
          name: 'Bank Transfer',
          type: 'BANK_TRANSFER',
          isEnabled: true,
          icon: 'https://api.aitrusttrade.com/icons/bank.png',
        },
      ],
    };
  }
}

