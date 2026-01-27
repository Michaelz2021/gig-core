import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrustScoreController } from './trust-score.controller';
import { TrustScoreService } from './trust-score.service';
import { TrustScore } from './entities/trust-score.entity';
import { UsersModule } from '../users/users.module';
import { ReviewsModule } from '../reviews/reviews.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrustScore]),
    UsersModule,
    ReviewsModule,
  ],
  controllers: [TrustScoreController],
  providers: [TrustScoreService],
  exports: [TrustScoreService],
})
export class TrustScoreModule {}
