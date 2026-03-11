import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { WalletController } from './wallet.controller';
import { PaymentXenditController } from './payment-xendit.controller';
import { XenditWebhookController } from './controllers/xendit-webhook.controller';
import { PayoutController } from './payout.controller';
import { PaymentsService } from './payments.service';
import { XenditPaymentService } from './services/xendit-payment.service';
import { XenditWebhookService } from './services/xendit-webhook.service';
import { Payment } from './entities/payment.entity';
import { Transaction } from './entities/transaction.entity';
import { Escrow } from './entities/escrow.entity';
import { Wallet } from './entities/wallet.entity';
import { PaymentSession } from './entities/payment-session.entity';
import { EscrowAccount } from './entities/escrow-account.entity';
import { Disbursement } from './entities/disbursement.entity';
import { Payout } from './entities/payout.entity';
import { RewardPaymentSession } from './entities/reward-payment-session.entity';
import { BookingsModule } from '../bookings/bookings.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RewardsModule } from '../rewards/rewards.module';
import { InstantInvoicesModule } from '../instant-invoices/instant-invoices.module';
import { XenditApiClient } from './services/xendit-api.client';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      Transaction,
      Escrow,
      Wallet,
      PaymentSession,
      EscrowAccount,
      Disbursement,
      Payout,
      RewardPaymentSession,
    ]),
    BookingsModule,
    UsersModule,
    NotificationsModule,
    RewardsModule,
    InstantInvoicesModule,
  ],
  controllers: [
    PaymentsController,
    WalletController,
    PaymentXenditController,
    XenditWebhookController,
    PayoutController,
  ],
  providers: [PaymentsService, XenditPaymentService, XenditWebhookService, XenditApiClient],
  exports: [PaymentsService],
})
export class PaymentsModule {}
