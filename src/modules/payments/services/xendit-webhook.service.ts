import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PaymentSession } from '../entities/payment-session.entity';
import { RewardPaymentSession } from '../entities/reward-payment-session.entity';
import { EscrowAccount } from '../entities/escrow-account.entity';
import { Disbursement } from '../entities/disbursement.entity';
import { BookingsService } from '../../bookings/bookings.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { RewardsService } from '../../rewards/rewards.service';

@Injectable()
export class XenditWebhookService {
  constructor(
    @InjectRepository(PaymentSession)
    private paymentSessionRepo: Repository<PaymentSession>,
    @InjectRepository(RewardPaymentSession)
    private rewardPaymentSessionRepo: Repository<RewardPaymentSession>,
    @InjectRepository(EscrowAccount)
    private escrowRepo: Repository<EscrowAccount>,
    @InjectRepository(Disbursement)
    private disbursementRepo: Repository<Disbursement>,
    private bookingsService: BookingsService,
    private notificationsService: NotificationsService,
    private configService: ConfigService,
    private rewardsService: RewardsService,
  ) {}

  verifyWebhook(callbackToken: string): boolean {
    const expectedToken = this.configService.get('XENDIT_WEBHOOK_VERIFY_TOKEN');
    return callbackToken === expectedToken;
  }

  async handlePaymentWebhook(data: any) {
    const { id, status, metadata } = data;

    if (status === 'SUCCEEDED') {
      await this.processSuccessfulPayment(id, metadata);
    } else if (status === 'FAILED') {
      await this.processFailedPayment(id, metadata);
    }
  }

  async handleDisbursementWebhook(data: any) {
    const { id, status, external_id } = data;

    if (status === 'COMPLETED') {
      await this.processCompletedDisbursement(id, external_id);
    } else if (status === 'FAILED') {
      await this.processFailedDisbursement(id, external_id);
    }
  }

  private async processSuccessfulPayment(id: string, metadata: any) {
    const session = await this.paymentSessionRepo.findOne({
      where: { xendit_payment_id: id },
    });
    if (session) {
      session.status = 'PAID';
      session.paid_at = new Date();
      await this.paymentSessionRepo.save(session);
      try {
        await this.notificationsService.send(
          session.buyer_id,
          NotificationType.PAYMENT,
          'Payment successful',
          'Your payment was completed successfully.',
          {
            relatedEntityType: 'payment_session',
            relatedEntityId: session.session_id,
          },
        );
      } catch (e) {
        // Don't fail webhook if notification fails
      }
      return;
    }

    const rewardSession = await this.rewardPaymentSessionRepo.findOne({
      where: { xenditPaymentId: id },
    });
    if (rewardSession) {
      await this.rewardsService.addCreditsFromPayment(rewardSession.session_id);
    }
  }

  private async processFailedPayment(id: string, metadata: any) {
    const session = await this.paymentSessionRepo.findOne({
      where: { xendit_payment_id: id },
    });
    if (session) {
      session.status = 'FAILED';
      await this.paymentSessionRepo.save(session);
      return;
    }
    const rewardSession = await this.rewardPaymentSessionRepo.findOne({
      where: { xenditPaymentId: id },
    });
    if (rewardSession) {
      rewardSession.status = 'FAILED';
      await this.rewardPaymentSessionRepo.save(rewardSession);
    }
  }

  private async processCompletedDisbursement(id: string, external_id: string) {
    const disbursement = await this.disbursementRepo.findOne({
      where: { xendit_disbursement_id: id },
    });
    if (disbursement) {
      disbursement.status = 'COMPLETED';
      disbursement.completed_at = new Date();
      await this.disbursementRepo.save(disbursement);
      try {
        await this.notificationsService.send(
          disbursement.provider_id,
          NotificationType.PAYMENT,
          'Payout completed',
          'Your disbursement has been completed.',
          {
            relatedEntityType: 'disbursement',
            relatedEntityId: disbursement.disbursement_id,
          },
        );
      } catch (e) {
        // Don't fail webhook if notification fails
      }
    }
    const escrow = await this.escrowRepo.findOne({
      where: { escrow_id: external_id },
    });
    if (escrow) {
      escrow.status = 'RELEASED';
      escrow.released_at = new Date();
      escrow.disbursement_status = 'COMPLETED';
      await this.escrowRepo.save(escrow);
    }
  }

  private async processFailedDisbursement(id: string, external_id: string) {
    const disbursement = await this.disbursementRepo.findOne({
      where: { xendit_disbursement_id: id },
    });
    if (disbursement) {
      disbursement.status = 'FAILED';
      await this.disbursementRepo.save(disbursement);
    }
    const escrow = await this.escrowRepo.findOne({
      where: { escrow_id: external_id },
    });
    if (escrow) {
      escrow.disbursement_status = 'FAILED';
      await this.escrowRepo.save(escrow);
    }
  }
}
