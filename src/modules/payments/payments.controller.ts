import { Controller, Get, Post, Body, UseGuards, Param, Query, ForbiddenException } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { WalletTopupDto } from './dto/wallet-topup.dto';
import { WalletWithdrawDto } from './dto/wallet-withdraw.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('payments')
@Controller('payment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Wallet APIs (for backward compatibility)
  @Get('wallet')
  @ApiOperation({ summary: 'Get wallet' })
  @ApiOkResponse({ description: 'Wallet balance returned' })
  wallet(@GetUser() user: any) {
    return this.paymentsService.getWallet(user.id);
  }

  @Get('wallet/transactions')
  @ApiOperation({ summary: 'Get wallet transaction history' })
  @ApiOkResponse({ description: 'Transaction history returned' })
  transactions(@GetUser() user: any) {
    return this.paymentsService.getWalletTransactions(user.id);
  }

  @Post('wallet/topup')
  @ApiOperation({ summary: 'Top up wallet' })
  @ApiOkResponse({ description: 'Top up successful' })
  topup(@GetUser() user: any, @Body() topupDto: WalletTopupDto) {
    return this.paymentsService.topup(user.id, topupDto);
  }

  @Post('wallet/withdraw')
  @ApiOperation({
    summary: 'Withdraw from wallet',
    description: '지갑에서 출금을 요청합니다. 출금 금액과 출금 대상 정보를 JSON으로 전송합니다.',
  })
  @ApiBody({ type: WalletWithdrawDto })
  @ApiResponse({
    status: 200,
    description: '출금 요청 처리 완료 (성공 또는 실패)',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: '출금 성공 여부',
          example: true,
        },
        reason: {
          type: 'string',
          enum: ['INSUFFICIENT_BALANCE', 'WITHDRAWAL_FAILED', 'INVALID_AMOUNT', 'INVALID_WITHDRAWAL_INFO', 'OTHER'],
          description: '실패 원인 (실패 시에만 반환)',
          example: 'INSUFFICIENT_BALANCE',
        },
        balance: {
          type: 'number',
          description: '출금 후 잔액 (성공 시) 또는 현재 잔액 (실패 시)',
          example: 5000.00,
        },
        message: {
          type: 'string',
          description: '응답 메시지',
          example: '출금이 성공적으로 처리되었습니다.',
        },
        error: {
          type: 'string',
          description: '에러 상세 정보 (에러 발생 시)',
          example: 'Database connection failed',
        },
      },
      example: {
        success: true,
        balance: 5000.00,
        message: '출금이 성공적으로 처리되었습니다.',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '출금 실패 - 잔액 부족',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        reason: { type: 'string', example: 'INSUFFICIENT_BALANCE' },
        balance: { type: 'number', example: 500.00 },
        message: { type: 'string', example: '잔액이 부족합니다. 현재 잔액: 500.00 PHP' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '출금 실패 - 기타 오류',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        reason: { type: 'string', example: 'WITHDRAWAL_FAILED' },
        message: { type: 'string', example: '출금 처리 중 오류가 발생했습니다.' },
        error: { type: 'string', example: 'Database connection failed' },
      },
    },
  })
  withdraw(@GetUser() user: any, @Body() withdrawDto: WalletWithdrawDto) {
    return this.paymentsService.withdraw(user.id, withdrawDto);
  }

  // Payment APIs (API spec)
  @Post('process')
  @ApiOperation({ summary: 'Process payment' })
  @ApiOkResponse({ description: 'Payment processed successfully' })
  process(@GetUser() user: any, @Body() processPaymentDto: ProcessPaymentDto) {
    return this.paymentsService.processPayment(user.id, processPaymentDto);
  }

  // Transactions APIs
  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false, enum: ['CLIENT', 'PROVIDER'] })
  @ApiQuery({ name: 'bookingId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Transaction history returned' })
  findAllTransactions(
    @GetUser() user: any,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('bookingId') bookingId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.paymentsService.findAllTransactions(user.id, bookingId, status, type, page || 1, limit || 20);
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get transaction details' })
  @ApiOkResponse({ description: 'Transaction details returned' })
  findOneTransaction(@Param('id') id: string) {
    return this.paymentsService.findOneTransaction(id);
  }

  // Escrows APIs
  @Get('escrows')
  @ApiOperation({ summary: 'Get escrow list' })
  @ApiQuery({ name: 'bookingId', required: false })
  @ApiOkResponse({ description: 'Escrow list returned' })
  findAllEscrows(@GetUser() user: any, @Query('bookingId') bookingId?: string) {
    return this.paymentsService.findAllEscrows(user.id, bookingId);
  }

  @Get('escrows/:id')
  @ApiOperation({ summary: 'Get escrow details' })
  @ApiOkResponse({ description: 'Escrow details returned' })
  findOneEscrow(@Param('id') id: string) {
    return this.paymentsService.findOneEscrow(id);
  }

  @Post('escrows/:id/release')
  @ApiOperation({ summary: 'Release escrow' })
  @ApiOkResponse({ description: 'Escrow released successfully' })
  releaseEscrow(@GetUser() user: any, @Param('id') id: string) {
    return this.paymentsService.releaseEscrow(id, user.id);
  }

  // Payment Methods API
  @Get('methods')
  @ApiOperation({ summary: 'Get payment methods' })
  @ApiOkResponse({ description: 'Payment methods list returned' })
  getPaymentMethods() {
    return this.paymentsService.getPaymentMethods();
  }
}
