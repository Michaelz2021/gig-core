import { Controller, Get, UseGuards, Param, ForbiddenException, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { PaymentsService } from './payments.service';

@ApiTags('wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class WalletController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('users/:userId/transactions')
  @ApiOperation({ 
    summary: 'Get user wallet transaction history',
    description: '사용자가 자신의 지갑 거래 내역을 조회합니다. 자신의 userId만 조회 가능합니다. page와 limit 파라미터로 페이징이 가능합니다.'
  })
  @ApiParam({ 
    name: 'userId', 
    description: '사용자 ID (UUID) - 자신의 ID만 조회 가능',
    type: String,
    example: 'a98a4eb5-4b1e-4851-99c6-f92806ae5f61'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본값: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 항목 수 (기본값: 20, 최대: 100)' })
  @ApiResponse({
    status: 200,
    description: 'User wallet transaction history returned successfully',
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
              walletId: { type: 'string', format: 'uuid', description: '지갑 ID' },
              userId: { type: 'string', format: 'uuid', description: '사용자 ID' },
              type: { 
                type: 'string', 
                enum: ['deposit', 'withdrawal', 'transfer', 'payment', 'refund', 'fee', 'reward'],
                description: '거래 유형'
              },
              amount: { type: 'number', description: '거래 금액' },
              currency: { type: 'string', description: '통화 (기본값: PHP)', example: 'PHP' },
              balanceBefore: { type: 'number', description: '거래 전 잔액' },
              balanceAfter: { type: 'number', description: '거래 후 잔액' },
              relatedTransactionId: { type: 'string', format: 'uuid', nullable: true, description: '관련 거래 ID' },
              relatedBookingId: { type: 'string', format: 'uuid', nullable: true, description: '관련 예약 ID' },
              status: { 
                type: 'string', 
                enum: ['pending', 'completed', 'failed', 'cancelled'],
                description: '거래 상태'
              },
              description: { type: 'string', nullable: true, description: '거래 설명' },
              paymentMethod: { type: 'string', nullable: true, description: '결제 수단' },
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
            walletId: '5e5e7589-0f55-4827-9f74-3dcb17ec88e0',
            userId: 'a98a4eb5-4b1e-4851-99c6-f92806ae5f61',
            type: 'deposit',
            amount: 5000.00,
            currency: 'PHP',
            balanceBefore: 4557.87,
            balanceAfter: 9557.87,
            relatedTransactionId: null,
            relatedBookingId: null,
            status: 'completed',
            description: 'Wallet top-up',
            paymentMethod: null,
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
  @ApiResponse({ status: 403, description: 'Forbidden - You can only view your own transactions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserTransactions(
    @Param('userId') userId: string,
    @GetUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    // 사용자는 자신의 거래 내역만 조회 가능
    if (user.id !== userId) {
      throw new ForbiddenException('You can only view your own transactions');
    }

    const pageNum = page ? Math.max(1, parseInt(String(page), 10)) : 1;
    const limitNum = limit ? Math.min(100, Math.max(1, parseInt(String(limit), 10))) : 20;

    return this.paymentsService.getWalletUserTransactions(userId, pageNum, limitNum);
  }
}
