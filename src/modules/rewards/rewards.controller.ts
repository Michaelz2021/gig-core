import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { RewardsService } from './rewards.service';
import { BuyCreditsDto } from './dto/buy-credits.dto';
import { SpendCreditsDto } from './dto/spend-credits.dto';
import { RewardBuyRequestDto } from './dto/reward-buy-request.dto';
import { RewardCreditTransaction } from '../payments/entities/reward-credit-transaction.entity';

@ApiTags('rewards')
@Controller('rewards')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('balance')
  @ApiOperation({
    summary: 'Get reward credits balance',
    description: 'Get current reward credits balance for the user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reward credits balance returned successfully',
    schema: {
      type: 'object',
      properties: {
        balance: {
          type: 'number',
          description: 'Current reward credits balance',
          example: 150,
        },
      },
      example: {
        balance: 150,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or expired token' })
  async getBalance(@GetUser() user: any) {
    return this.rewardsService.getBalance(user.id);
  }

  @Get('transactions')
  @ApiOperation({
    summary: 'Get reward credits transaction history',
    description: 'Get reward credits transaction history. Use page and limit for pagination.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본값: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 항목 수 (기본값: 20, 최대: 100)' })
  @ApiResponse({
    status: 200,
    description: 'Reward credits transaction history returned successfully',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          description: 'Transaction list',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid', description: 'Transaction ID' },
              userId: { type: 'string', format: 'uuid', description: 'User ID' },
              transactionType: {
                type: 'string',
                enum: ['earned', 'spent', 'purchased', 'bonus', 'penalty', 'refunded'],
                description: 'Transaction type',
              },
              creditsChange: { type: 'number', description: 'Credits change (+/-)' },
              creditsBefore: { type: 'number', description: 'Credits before transaction' },
              creditsAfter: { type: 'number', description: 'Credits after transaction' },
              reason: { type: 'string', nullable: true, description: 'Transaction reason' },
              description: { type: 'string', nullable: true, description: 'Detail description' },
              relatedBookingId: { type: 'string', format: 'uuid', nullable: true, description: 'Related booking ID' },
              relatedAuctionId: { type: 'string', format: 'uuid', nullable: true, description: 'Related auction ID' },
              expiresAt: { type: 'string', format: 'date-time', nullable: true, description: 'Expiry date' },
              createdAt: { type: 'string', format: 'date-time', description: 'Created at' },
            },
          },
        },
        total: { type: 'number', description: 'Total transaction count' },
        page: { type: 'number', description: 'Current page number' },
        limit: { type: 'number', description: 'Items per page' },
      },
      example: {
        items: [
          {
            id: '7f7ebd14-b47e-4374-bf9c-16cdcaf7896b',
            userId: 'a98a4eb5-4b1e-4851-99c6-f92806ae5f61',
            transactionType: 'purchased',
            creditsChange: 100,
            creditsBefore: 50,
            creditsAfter: 150,
            reason: 'Credit purchase',
            description: 'Purchased 100 credits',
            relatedBookingId: null,
            relatedAuctionId: null,
            expiresAt: null,
            createdAt: '2025-12-18T07:55:29.572Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or expired token' })
  async getTransactions(
    @GetUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const pageNum = page ? Math.max(1, parseInt(String(page), 10)) : 1;
    const limitNum = limit ? Math.min(100, Math.max(1, parseInt(String(limit), 10))) : 20;

    return this.rewardsService.getTransactions(user.id, pageNum, limitNum);
  }

  @Post('buy/request')
  @ApiOperation({
    summary: 'Request reward credits payment (Xendit)',
    description:
      'Submit payment for reward credits with selected method (CARD, GCASH, etc.). Same flow as /api/v1/payment/xenditprocess. On success (via webhook), reward_credits and reward_credit_transactions are updated.',
  })
  @ApiBody({
    type: RewardBuyRequestDto,
    examples: {
      card: {
        summary: '[테스트] Card',
        description: 'payment_session_id는 buy/initialization 응답에서 복사',
        value: {
          payment_session_id: 'PSESS-REWARD-1735123456789',
          payment_method: 'CARD',
          return_url: 'gigmarket://payment/callback',
          card_details: {
            card_number: '4000000000000002',
            exp_month: '12',
            exp_year: '2028',
            cvv: '123',
          },
        },
      },
      gcash: {
        summary: '[테스트] GCash (card_details 없음)',
        value: {
          payment_session_id: 'PSESS-REWARD-1735123456789',
          payment_method: 'GCASH',
          return_url: 'gigmarket://payment/callback',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Payment created; redirect user to payment_url or display qr_code',
    schema: {
      type: 'object',
      properties: {
        xendit_payment_id: { type: 'string', example: 'pr-xxx' },
        payment_url: { type: 'string', example: 'https://checkout.xendit.co/web/xxx' },
        qr_code: { type: 'string', nullable: true, example: null },
        redirect_required: { type: 'boolean', example: true },
        expires_at: { type: 'string', format: 'date-time', example: '2025-12-26T18:00:00Z' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid session or payment method' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async rewardBuyRequest(@GetUser() user: any, @Body() dto: RewardBuyRequestDto) {
    return this.rewardsService.rewardBuyRequest(user.id, dto);
  }

  @Post('buy/initialization')
  @ApiOperation({
    summary: 'Initialize reward credits purchase (payment session)',
    description:
      'Create a payment session for buying reward credits. Returns same format as booking payment initialize: payment_session_id, amount, breakdown, available_methods, expires_at. bookingId is null for rewards.',
  })
  @ApiBody({
    type: BuyCreditsDto,
    examples: {
      default: {
        summary: '[테스트] 100 credits (다음 단계 buy/request에서 payment_session_id 사용)',
        value: {
          credits: 100,
          reason: 'Auction bid credits',
          description: 'Purchased 100 credits for auction bidding',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Payment session initialized. Use data.payment_session_id in POST /rewards/buy/request',
    schema: {
      type: 'object',
      properties: {
        payment_session_id: { type: 'string', example: 'PSESS-REWARD-1735123456789' },
        bookingId: { type: 'string', nullable: true, example: null },
        amount: { type: 'number', example: 104.0 },
        breakdown: {
          type: 'object',
          properties: {
            service_cost: { type: 'number', example: 100.0 },
            platform_fee: { type: 'number', example: 4.0 },
            insurance: { type: 'number', example: 0 },
          },
        },
        available_methods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method_type: { type: 'string', example: 'CARD' },
              display_name: { type: 'string', example: 'Credit/Debit Card' },
              fee: { type: 'string', example: '2.5%' },
              processing_time: { type: 'string', example: 'Instant' },
            },
          },
        },
        expires_at: { type: 'string', format: 'date-time', example: '2025-12-26T18:00:00Z' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid credits amount' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or expired token' })
  async buyInitialization(@GetUser() user: any, @Body() buyCreditsDto: BuyCreditsDto) {
    return this.rewardsService.initializeRewardPurchase(
      user.id,
      buyCreditsDto.credits,
      buyCreditsDto.reason,
      buyCreditsDto.description,
    );
  }

  @Post('buy')
  @ApiOperation({
    summary: 'Buy reward credits',
    description: 'Purchase reward credits (direct credit add; for payment flow use buy/initialization first).',
  })
  @ApiResponse({
    status: 201,
    description: 'Reward credits purchased successfully',
    type: RewardCreditTransaction,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid credits amount' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or expired token' })
  async buyCredits(@GetUser() user: any, @Body() buyCreditsDto: BuyCreditsDto) {
    return this.rewardsService.buyCredits(
      user.id,
      buyCreditsDto.credits,
      buyCreditsDto.reason,
      buyCreditsDto.description,
    );
  }

  @Post('spend')
  @ApiOperation({
    summary: 'Spend reward credits',
    description: 'Spend reward credits (e.g. for auction bid).',
  })
  @ApiResponse({
    status: 201,
    description: 'Reward credits spent successfully',
    type: RewardCreditTransaction,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Insufficient credits or invalid amount' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or expired token' })
  async spendCredits(@GetUser() user: any, @Body() spendCreditsDto: SpendCreditsDto) {
    return this.rewardsService.spendCredits(
      user.id,
      spendCreditsDto.credits,
      spendCreditsDto.reason,
      spendCreditsDto.description,
      spendCreditsDto.relatedBookingNumber,
    );
  }
}

