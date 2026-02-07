import { Controller, Get, Post, Body, UseGuards, Param, Query, ForbiddenException } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { WalletTopupDto } from './dto/wallet-topup.dto';
import { WalletWithdrawDto } from './dto/wallet-withdraw.dto';
import { InitializePaymentSessionDto } from './dto/initialize-payment-session.dto';
import { XenditProcessDto } from './dto/xendit-process.dto';
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
    description: 'Request withdrawal from wallet. Send amount and withdrawal target info as JSON.',
  })
  @ApiBody({ type: WalletWithdrawDto })
  @ApiResponse({
    status: 200,
    description: 'Withdrawal request completed (success or failure)',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: 'Whether withdrawal succeeded',
          example: true,
        },
        reason: {
          type: 'string',
          enum: ['INSUFFICIENT_BALANCE', 'WITHDRAWAL_FAILED', 'INVALID_AMOUNT', 'INVALID_WITHDRAWAL_INFO', 'OTHER'],
          description: 'Failure reason (returned on failure only)',
          example: 'INSUFFICIENT_BALANCE',
        },
        balance: {
          type: 'number',
          description: 'Balance after withdrawal (success) or current balance (failure)',
          example: 5000.00,
        },
        message: {
          type: 'string',
          description: 'Response message',
          example: 'Withdrawal processed successfully.',
        },
        error: {
          type: 'string',
          description: 'Error details (when error occurs)',
          example: 'Database connection failed',
        },
      },
      example: {
        success: true,
        balance: 5000.00,
        message: 'Withdrawal processed successfully.',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Withdrawal failed - insufficient balance',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        reason: { type: 'string', example: 'INSUFFICIENT_BALANCE' },
        balance: { type: 'number', example: 500.00 },
        message: { type: 'string', example: 'Insufficient balance. Current balance: 500.00 PHP' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Withdrawal failed - other error',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        reason: { type: 'string', example: 'WITHDRAWAL_FAILED' },
        message: { type: 'string', example: 'An error occurred while processing withdrawal.' },
        error: { type: 'string', example: 'Database connection failed' },
      },
    },
  })
  withdraw(@GetUser() user: any, @Body() withdrawDto: WalletWithdrawDto) {
    return this.paymentsService.withdraw(user.id, withdrawDto);
  }

  // Payment Session Initialization (contract payment)
  @Post('contracts/:contractId/initialize')
  @ApiOperation({
    summary: 'Initialize payment session for contract',
    description: 'Create a payment session for a contract. Returns session id, amount breakdown, and available payment methods (CARD, GCash, PayMaya, QR.ph, InstaPay).',
  })
  @ApiParam({ name: 'contractId', description: 'Contract ID (UUID)' })
  @ApiBody({ type: InitializePaymentSessionDto })
  @ApiOkResponse({
    description: 'Payment session initialized',
    schema: {
      type: 'object',
      properties: {
        payment_session_id: { type: 'string', example: 'PSESS-2025-001' },
        bookingId: { type: 'string', example: 'CON-2025-001234' },
        amount: { type: 'number', example: 2140.0 },
        breakdown: {
          type: 'object',
          properties: {
            service_cost: { type: 'number', example: 2000.0 },
            platform_fee: { type: 'number', example: 140.0 },
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
  initializePaymentSession(
    @GetUser() user: any,
    @Param('contractId') contractId: string,
    @Body() dto: InitializePaymentSessionDto,
  ) {
    return this.paymentsService.initializePaymentSession(contractId, user.id, dto);
  }

  @Post('xenditprocess')
  @ApiOperation({
    summary: 'Process payment via Xendit',
    description: 'Submit payment with selected method (CARD, GCASH, PAYMAYA, QRPH, INSTAPAY). Returns payment URL for redirect or QR code for QR.ph.',
  })
  @ApiBody({ type: XenditProcessDto })
  @ApiOkResponse({
    description: 'Payment created; redirect user to payment_url or display qr_code',
    schema: {
      type: 'object',
      properties: {
        xendit_payment_id: { type: 'string', example: 'XDT-67890' },
        payment_url: { type: 'string', example: 'https://checkout.xendit.co/web/67890' },
        qr_code: { type: 'string', example: 'data:image/png;base64,...', description: 'Present for QR.ph' },
        redirect_required: { type: 'boolean', example: true },
        expires_at: { type: 'string', format: 'date-time', example: '2025-12-25T15:00:00Z' },
      },
    },
  })
  xenditProcess(@GetUser() user: any, @Body() dto: XenditProcessDto) {
    return this.paymentsService.xenditProcess(user.id, dto);
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
