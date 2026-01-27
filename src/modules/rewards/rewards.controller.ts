import { Controller, Get, Post, Body, UseGuards, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { RewardsService } from './rewards.service';
import { BuyCreditsDto } from './dto/buy-credits.dto';
import { SpendCreditsDto } from './dto/spend-credits.dto';
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
    description: '사용자의 현재 리워드 크레딧 잔액을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reward credits balance returned successfully',
    schema: {
      type: 'object',
      properties: {
        balance: {
          type: 'number',
          description: '현재 리워드 크레딧 잔액',
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
    description: '사용자의 리워드 크레딧 거래 내역을 조회합니다. page와 limit 파라미터로 페이징이 가능합니다.',
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
          description: '거래 내역 배열',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid', description: '거래 ID' },
              userId: { type: 'string', format: 'uuid', description: '사용자 ID' },
              transactionType: {
                type: 'string',
                enum: ['earned', 'spent', 'purchased', 'bonus', 'penalty', 'refunded'],
                description: '거래 유형',
              },
              creditsChange: { type: 'number', description: '크레딧 변화량 (+/-)' },
              creditsBefore: { type: 'number', description: '거래 전 크레딧' },
              creditsAfter: { type: 'number', description: '거래 후 크레딧' },
              reason: { type: 'string', nullable: true, description: '거래 사유' },
              description: { type: 'string', nullable: true, description: '상세 설명' },
              relatedBookingId: { type: 'string', format: 'uuid', nullable: true, description: '관련 예약 ID' },
              relatedAuctionId: { type: 'string', format: 'uuid', nullable: true, description: '관련 경매 ID' },
              expiresAt: { type: 'string', format: 'date-time', nullable: true, description: '만료일' },
              createdAt: { type: 'string', format: 'date-time', description: '생성 일시' },
            },
          },
        },
        total: { type: 'number', description: '총 거래 개수' },
        page: { type: 'number', description: '현재 페이지 번호' },
        limit: { type: 'number', description: '페이지당 항목 수' },
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

  @Post('buy')
  @ApiOperation({
    summary: 'Buy reward credits',
    description: '리워드 크레딧을 구매합니다.',
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
    description: '리워드 크레딧을 사용합니다. (예: 경매 입찰 등)',
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
      spendCreditsDto.relatedAuctionId,
      spendCreditsDto.relatedBookingId,
    );
  }
}

