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
    description: 'Get wallet transaction history for the current user. Only own userId can be queried. Use page and limit for pagination.'
  })
  @ApiParam({ 
    name: 'userId', 
    description: 'User ID (UUID) - only own ID can be queried',
    type: String,
    example: 'a98a4eb5-4b1e-4851-99c6-f92806ae5f61'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiResponse({
    status: 200,
    description: 'User wallet transaction history returned successfully',
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
              walletId: { type: 'string', format: 'uuid', description: 'Wallet ID' },
              userId: { type: 'string', format: 'uuid', description: 'User ID' },
              type: { 
                type: 'string', 
                enum: ['deposit', 'withdrawal', 'transfer', 'payment', 'refund', 'fee', 'reward'],
                description: 'Transaction type'
              },
              amount: { type: 'number', description: 'Transaction amount' },
              currency: { type: 'string', description: 'Currency (default: PHP)', example: 'PHP' },
              balanceBefore: { type: 'number', description: 'Balance before transaction' },
              balanceAfter: { type: 'number', description: 'Balance after transaction' },
              relatedTransactionId: { type: 'string', format: 'uuid', nullable: true, description: 'Related transaction ID' },
              relatedBookingId: { type: 'string', format: 'uuid', nullable: true, description: 'Related booking ID' },
              status: { 
                type: 'string', 
                enum: ['pending', 'completed', 'failed', 'cancelled'],
                description: 'Transaction status'
              },
              description: { type: 'string', nullable: true, description: 'Transaction description' },
              paymentMethod: { type: 'string', nullable: true, description: 'Payment method' },
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
