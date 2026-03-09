import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from './entities/booking.entity';
import { Contract } from './entities/contract.entity';
import { SmartContract } from './entities/smart-contract.entity';
import { WorkProgressReport } from './entities/work-progress-report.entity';
import { Quote } from '../quotes/entities/quote.entity';
import { Auction } from '../matching/entities/auction.entity';
import { ServicesModule } from '../services/services.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Contract, SmartContract, WorkProgressReport, Quote, Auction]),
    ServicesModule,
    UsersModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
