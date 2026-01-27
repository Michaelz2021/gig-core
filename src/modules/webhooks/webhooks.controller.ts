import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('payment/completed')
  @Public()
  @ApiOperation({ summary: 'Payment completed webhook' })
  @ApiHeader({ name: 'X-Webhook-Signature', required: false })
  async paymentCompleted(
    @Body() payload: any,
    @Headers('x-webhook-signature') signature?: string,
  ) {
    return this.webhooksService.handlePaymentCompleted(payload, signature);
  }

  @Post('message/received')
  @Public()
  @ApiOperation({ summary: 'Message received webhook' })
  @ApiHeader({ name: 'X-Webhook-Signature', required: false })
  async messageReceived(
    @Body() payload: any,
    @Headers('x-webhook-signature') signature?: string,
  ) {
    return this.webhooksService.handleMessageReceived(payload, signature);
  }
}

