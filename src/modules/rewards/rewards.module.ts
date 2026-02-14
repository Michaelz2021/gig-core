import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';
import { RewardCredit } from './entities/reward-credit.entity';
import { RewardCreditTransaction } from '../payments/entities/reward-credit-transaction.entity';
import { RewardPaymentSession } from '../payments/entities/reward-payment-session.entity';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([RewardCredit, RewardCreditTransaction, RewardPaymentSession]),
    BookingsModule,
  ],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}

