// src/modules/payments/controllers/xendit-webhook.controller.ts

import { Controller, Post, Body, Headers, BadRequestException } from '@nestjs/common';
import { XenditWebhookService } from '../services/xendit-webhook.service';

@Controller('api/v1/webhooks/xendit')
export class XenditWebhookController {
  constructor(private xenditWebhookService: XenditWebhookService) {}

  /**
   * Xendit Payment Webhook
   * Called by Xendit when payment status changes
   */
  @Post('payment')
  async handlePaymentWebhook(
    @Headers('x-callback-token') callbackToken: string,
    @Body() webhookData: any,
  ) {
    // 1. Verify webhook signature
    if (!this.xenditWebhookService.verifyWebhook(callbackToken)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // 2. Process webhook
    await this.xenditWebhookService.handlePaymentWebhook(webhookData);

    return { received: true };
  }

  /**
   * Xendit Disbursement Webhook
   * Called by Xendit when disbursement status changes
   */
  @Post('disbursement')
  async handleDisbursementWebhook(
    @Headers('x-callback-token') callbackToken: string,
    @Body() webhookData: any,
  ) {
    // 1. Verify webhook signature
    if (!this.xenditWebhookService.verifyWebhook(callbackToken)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // 2. Process webhook
    await this.xenditWebhookService.handleDisbursementWebhook(webhookData);

    return { received: true };
  }
}