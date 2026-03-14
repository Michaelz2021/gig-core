import { Controller, Get, Post, Body, UseGuards, Param, Query, ForbiddenException, UseFilters } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { WalletTopupDto } from './dto/wallet-topup.dto';
import { WalletWithdrawDto } from './dto/wallet-withdraw.dto';
import { XenditProcessDto } from './dto/xendit-process.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { XenditExceptionFilter } from '../../common/filters/xendit-exception.filter';

@ApiTags('payments')
@Controller('payment')
@UseGuards(JwtAuthGuard)
@UseFilters(XenditExceptionFilter)
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
    return this.paymentsService.topupViaXendit(user.id, topupDto);
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

  /**
   * GET /api/v1/payment/payout-summary
   * 앱에서 호출하는 경로 (provider 출금 요약)
   */
  @Get('payout-summary')
  @ApiOperation({
    summary: 'Get payout summary (provider)',
    description: '출금 가능 금액/건수, 출금 가능 목록, 최근 출금 내역을 반환합니다.',
  })
  @ApiOkResponse({
    description: 'Payout summary returned',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            summary: {
              type: 'object',
              properties: {
                total_available: { type: 'number' },
                pending_amount: { type: 'number' },
                ready_count: { type: 'number' },
                pending_count: { type: 'number' },
              },
            },
            available_payouts: { type: 'array', items: { type: 'object' } },
            recent_payouts: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
  })
  getPayoutSummary(@GetUser() user: any) {
    return this.paymentsService.getPayoutSummary(user.id);
  }

  // Payment Session Initialization (contract payment)
  @Post('contracts/:contractId/initialize')
  @ApiOperation({
    summary: 'Initialize payment session for contract',
    description: 'Create a payment session for a contract (no body). Returns session id, amount breakdown, and available payment methods (CARD, GCash, PayMaya, QR.ph, InstaPay).',
  })
  @ApiParam({
    name: 'contractId',
    description: 'Contract ID (UUID) or booking_number (e.g. BOOK-xxx) when contract not created yet',
  })
  @ApiOkResponse({
    description: 'Payment session initialized',
    schema: {
      type: 'object',
      properties: {
        payment_session_id: { type: 'string', example: 'PSESS-1735123456789' },
        contract_id: { type: 'string' },
        booking_id: { type: 'string' },
        amount: { type: 'number', example: 2140.0 },
        breakdown: {
          type: 'object',
          properties: {
            service_cost: { type: 'number', example: 2000.0 },
            platform_fee: { type: 'number', example: 140.0 },
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
            },
          },
        },
        expires_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  initializePaymentSession(
    @GetUser() user: any,
    @Param('contractId') contractIdOrBookingNumber: string,
  ) {
    // 앱에서 계약 없을 때 booking_number를 같은 path에 넣어 호출 (BOOK-xxx 형식)
    const isBookingNumber = contractIdOrBookingNumber.startsWith('BOOK-');
    if (isBookingNumber) {
      return this.paymentsService.initializePaymentSessionByBookingNumber(
        contractIdOrBookingNumber,
        user.id,
      );
    }
    return this.paymentsService.initializePaymentSession(contractIdOrBookingNumber, user.id);
  }

  /** Instant order 전용: instant_booking_id로 결제 세션 초기화. 정식 오더는 contracts/:contractId/initialize 사용. */
  @Post('instant-bookings/:instantBookingId/initialize')
  @ApiOperation({
    summary: 'Initialize payment session for Instant order',
    description:
      'Create a payment session for an instant order by instant_booking_id. Use this for Instant orders; for regular orders use POST payment/contracts/:contractId/initialize. Requires an instant_invoice to exist for the instant booking (e.g. created after provider confirms).',
  })
  @ApiParam({ name: 'instantBookingId', description: 'Instant booking UUID' })
  @ApiOkResponse({
    description: 'Payment session initialized (same shape as contracts initialize)',
    schema: {
      type: 'object',
      properties: {
        payment_session_id: { type: 'string' },
        contract_id: { type: 'string' },
        booking_id: { type: 'string' },
        amount: { type: 'number' },
        breakdown: { type: 'object', properties: { service_cost: { type: 'number' }, platform_fee: { type: 'number' } } },
        available_methods: { type: 'array' },
        expires_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  initializePaymentSessionForInstant(
    @GetUser() user: any,
    @Param('instantBookingId') instantBookingId: string,
  ) {
    return this.paymentsService.initializePaymentSessionForInstantBooking(instantBookingId, user.id);
  }

  // Payment Session Initialization by booking_number (계약서 없이 예약만 있는 경우)
  @Post('bookings/:bookingNumber/initialize')
  @ApiOperation({
    summary: 'Initialize payment session by booking number',
    description: 'Create a payment session for a booking using booking_number (no contract yet). Looks up booking table and returns same format: session id, amount breakdown, available payment methods.',
  })
  @ApiParam({ name: 'bookingNumber', description: 'Booking number (e.g. BOOK-1735123456789-ABC)' })
  @ApiOkResponse({
    description: 'Payment session initialized',
    schema: {
      type: 'object',
      properties: {
        payment_session_id: { type: 'string', example: 'PSESS-1735123456789' },
        contract_id: { type: 'string', description: 'Placeholder (booking_id) when contract not created yet' },
        booking_id: { type: 'string' },
        amount: { type: 'number', example: 2140.0 },
        breakdown: {
          type: 'object',
          properties: {
            service_cost: { type: 'number', example: 2000.0 },
            platform_fee: { type: 'number', example: 140.0 },
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
            },
          },
        },
        expires_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  initializePaymentSessionByBookingNumber(
    @GetUser() user: any,
    @Param('bookingNumber') bookingNumber: string,
  ) {
    return this.paymentsService.initializePaymentSessionByBookingNumber(bookingNumber, user.id);
  }

  @Post('xenditprocess')
  @ApiOperation({
    summary: 'Process payment via Xendit',
    description: 'Submit payment with selected method (CARD, GCASH, PAYMAYA, QRPH, INSTAPAY). Returns payment URL for redirect or QR code for QR.ph. Body는 반드시 유효한 JSON (쉼표·따옴표 확인).',
  })
  @ApiBody({
    type: XenditProcessDto,
    examples: {
      card: {
        summary: 'CARD 결제',
        value: {
          payment_session_id: 'PSESS-1771034864760',
          booking_id: '16ce453c-428a-4b1f-b685-1d336e4d339d',
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
    },
  })
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

  @Get('status/:sessionId')
  @ApiOperation({ summary: 'Get payment session status' })
  @ApiParam({ name: 'sessionId', description: 'Payment session ID (e.g. PSESS-2025-001)' })
  @ApiOkResponse({
    description: 'Payment session status returned',
    schema: {
      type: 'object',
      properties: {
        payment_session_id: { type: 'string' },
        xendit_payment_id: { type: 'string', nullable: true },
        status: { type: 'string', enum: ['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'EXPIRED'] },
        payment_method: { type: 'string', nullable: true },
        amount: { type: 'number' },
        paid_at: { type: 'string', format: 'date-time', nullable: true },
        expires_at: { type: 'string', format: 'date-time', nullable: true },
      },
    },
  })
  getPaymentStatus(@GetUser() user: any, @Param('sessionId') sessionId: string) {
    return this.paymentsService.getPaymentStatus(sessionId, user.id);
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
