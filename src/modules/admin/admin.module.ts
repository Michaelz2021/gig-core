import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { NoticesModule } from '../notices/notices.module';
import { Auction } from '../matching/entities/auction.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { Escrow } from '../payments/entities/escrow.entity';
import { Transaction } from '../payments/entities/transaction.entity';
import { Wallet } from '../payments/entities/wallet.entity';
import { WalletTransaction } from '../payments/entities/wallet-transaction.entity';
import { Service } from '../services/entities/service.entity';
import { ServiceCategory } from '../services/entities/service-category.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { AuctionBid } from '../matching/entities/auction-bid.entity';
import { Provider } from '../users/entities/provider.entity';
import { Portfolio } from '../users/entities/portfolio.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auction, Booking, User, Escrow, Transaction, Wallet, WalletTransaction, Service, ServiceCategory, UserProfile, AuctionBid, Provider, Portfolio]),
    NoticesModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

