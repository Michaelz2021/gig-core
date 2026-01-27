import { Injectable, BadRequestException } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WebhooksService {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  async handlePaymentCompleted(payload: any, signature?: string) {
    // Verify webhook signature (implement based on your payment provider)
    // if (signature && !this.verifySignature(payload, signature)) {
    //   throw new BadRequestException('Invalid webhook signature');
    // }

    const { event, data } = payload;

    if (event !== 'payment.completed') {
      throw new BadRequestException('Invalid event type');
    }

    // Process payment completion
    // TODO: Update transaction status, release escrow, etc.

    // Send notification
    if (data.userId) {
      await this.notificationsService.send(
        data.userId,
        'TRANSACTION' as any,
        'Payment Completed',
        `Your payment of ${data.amount} PHP has been completed.`,
        { transactionId: data.transactionId },
      );
    }

    return {
      success: true,
      message: 'Webhook processed successfully',
    };
  }

  async handleMessageReceived(payload: any, signature?: string) {
    const { event, data } = payload;

    if (event !== 'message.received') {
      throw new BadRequestException('Invalid event type');
    }

    // Process message received
    // TODO: Send push notification, update unread count, etc.

    return {
      success: true,
      message: 'Webhook processed successfully',
    };
  }

  private verifySignature(payload: any, signature: string): boolean {
    // Implement signature verification logic
    // This should match your webhook provider's signature algorithm
    return true; // Placeholder
  }
}

