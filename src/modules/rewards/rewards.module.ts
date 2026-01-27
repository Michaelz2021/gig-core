import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';
import { RewardCredit } from './entities/reward-credit.entity';
import { RewardCreditTransaction } from '../payments/entities/reward-credit-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RewardCredit, RewardCreditTransaction])],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}

