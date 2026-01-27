import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { ServicesModule } from '../services/services.module';
import { UsersModule } from '../users/users.module';
import { BookingsModule } from '../bookings/bookings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Auction } from './entities/auction.entity';
import { AuctionBid } from './entities/auction-bid.entity';
import { AIQuotationSession } from './entities/ai-quotation-session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auction, AuctionBid, AIQuotationSession]),
    ServicesModule,
    UsersModule,
    BookingsModule,
    NotificationsModule,
  ],
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
