import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { XenditProcessDto } from './dto/xendit-process.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payment/xendit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class PaymentXenditController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('process')
  @ApiOperation({
    summary: 'Process payment via Xendit (xendit path)',
    description:
      'Submit payment with selected method (CARD, GCASH, PAYMAYA, QRPH, INSTAPAY). Requires payment_session_id, booking_id, payment_method, return_url; card_details when method is CARD. Returns payment URL or QR code.',
  })
  @ApiBody({ type: XenditProcessDto })
  @ApiOkResponse({
    description: 'Payment created; redirect URL or QR code returned',
    schema: {
      type: 'object',
      properties: {
        xendit_payment_id: { type: 'string' },
        payment_url: { type: 'string' },
        qr_code: { type: 'string' },
        redirect_required: { type: 'boolean' },
        expires_at: { type: 'string', format: 'date-time' },
      },
    },
  })
  async processPayment(@GetUser() user: any, @Body() dto: XenditProcessDto) {
    return this.paymentsService.xenditProcess(user.id, dto);
  }
}
