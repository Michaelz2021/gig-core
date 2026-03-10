import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiOkResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { PaymentsService } from './payments.service';
import { WalletTopupDto } from './dto/wallet-topup.dto';

@ApiTags('wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class WalletController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ─── POST /wallet/topup ──────────────────────────────────────────────────

  @Post('topup')
  @ApiOperation({
    summary: 'Top up wallet via Xendit',
    description: `
Top up the authenticated user's wallet.

**Step 1** — Pick an amount: 100, 200, 300, 500, or 1000 PHP.

**Step 2** — Pick a payment method and provide the required fields:

| Method   | Required fields              |
|----------|------------------------------|
| GCASH    | _(none)_                     |
| PAYMAYA  | _(none)_                     |
| CARD     | card_details (all fields)    |
| INSTAPAY | _(none)_                     |
| QRPH     | _(none — returns a QR code)_ |

**Step 3** — Open the returned \`payment_url\` in an InAppBrowser (for GCASH/PAYMAYA/CARD/INSTAPAY), or display the \`qr_code\` (for QRPH).

Wallet balance is updated automatically once Xendit confirms payment via webhook.
    `.trim(),
  })
  @ApiBody({ type: WalletTopupDto })
  @ApiOkResponse({
    description: 'Payment created — open payment_url or display qr_code',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            reference_id:      { type: 'string',  example: 'topup-uuid-1234-1735000000000' },
            xendit_payment_id: { type: 'string',  example: 'pr-abc123' },
            amount:            { type: 'number',  example: 500 },
            payment_method:    { type: 'string',  example: 'GCASH' },
            payment_url:       { type: 'string',  example: 'https://checkout.xendit.co/...',  nullable: true },
            qr_code:           { type: 'string',  example: 'data:image/png;base64,...',        nullable: true },
            redirect_required: { type: 'boolean', example: true },
            status:            { type: 'string',  example: 'PENDING' },
            message:           { type: 'string',  example: 'You will be redirected to GCash to complete your top-up.' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request — invalid amount, missing fields, or Xendit error' })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or expired token' })
  async topup(@GetUser() user: any, @Body() dto: WalletTopupDto) {
    return this.paymentsService.topupViaXendit(user.id, dto); // Passes the user's ID and the validated body to the service
  }
  // Meaning: It reads the JWT token from the request and extracts the logged-in user's info
  //So user.id is the ID of whoever is logged in — you never need to pass it manually
  // @Body() grabs the JSON body from the request (what Postman sends)
  // WalletTopupDto validates it automatically — Wrong amount? Wrong method? Rejected here before reaching the service
  // dto now contains the validated { amount, payment_method, card_details? }

  // ─── GET /wallet/users/:userId/transactions ──────────────────────────────

  @Get('users/:userId/transactions')  // GET route
  @ApiOperation({
    summary: 'Get user wallet transaction history',
    description:
      'Get wallet transaction history for the current user. Only own userId can be queried. Use page and limit for pagination.',
  })
  @ApiParam({ // the optional ?page=1&limit=20 query parameters. 
    name: 'userId', // if URL is /wallet/users/abc-123/transactions, then userId = 'abc-123'.
    description: 'User ID (UUID) — only your own ID can be queried',
    type: String,
    example: 'a98a4eb5-4b1e-4851-99c6-f92806ae5f61',
  })
  @ApiQuery({ name: 'page',  required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiResponse({
    status: 200,
    description: 'User wallet transaction history returned successfully',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id:                   { type: 'string', format: 'uuid' },
              walletId:             { type: 'string', format: 'uuid' },
              userId:               { type: 'string', format: 'uuid' },
              type:                 { type: 'string', enum: ['deposit', 'withdrawal', 'transfer', 'payment', 'refund', 'fee', 'reward'] },
              amount:               { type: 'number' },
              currency:             { type: 'string', example: 'PHP' },
              balanceBefore:        { type: 'number' },
              balanceAfter:         { type: 'number' },
              relatedTransactionId: { type: 'string', format: 'uuid', nullable: true },
              relatedBookingId:     { type: 'string', format: 'uuid', nullable: true },
              status:               { type: 'string', enum: ['pending', 'completed', 'failed', 'cancelled'] },
              description:          { type: 'string', nullable: true },
              paymentMethod:        { type: 'string', nullable: true },
              createdAt:            { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number' },
        page:  { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — you can only view your own transactions' })
  async getUserTransactions(
    @Param('userId') userId: string,
    @GetUser() user: any, // gets the logged-in user from JWT token
    @Query('page')  page?:  number, // optional
    @Query('limit') limit?: number,
  ) {
    if (user.id !== userId) { // You can never see someone else's transactions.
      throw new ForbiddenException('You can only view your own transactions');
    }

    const pageNum  = page  ? Math.max(1,   parseInt(String(page),  10)) : 1;
    const limitNum = limit ? Math.min(100, parseInt(String(limit), 10)) : 20;

    return this.paymentsService.getWalletUserTransactions(userId, pageNum, limitNum);
    // Passes the userId and sanitized page/limit to the service which queries the DB and returns the transactions.

  }
}