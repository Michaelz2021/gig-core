import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { WalletController } from './wallet.controller';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { Transaction } from './entities/transaction.entity';
import { Escrow } from './entities/escrow.entity';
import { Wallet } from './entities/wallet.entity';
import { BookingsModule } from '../bookings/bookings.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Transaction, Escrow, Wallet]),
    BookingsModule,
    UsersModule,
  ],
  controllers: [PaymentsController, WalletController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
