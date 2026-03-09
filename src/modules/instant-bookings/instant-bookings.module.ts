import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstantBooking } from './entities/instant-booking.entity';
import { ServiceListing } from '../listings/entities/service-listing.entity';
import { Provider } from '../users/entities/provider.entity';
import { InstantBookingsController } from './instant-bookings.controller';
import { BookingQueueController } from './booking-queue.controller';
import { InstantBookingsService } from './instant-bookings.service';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InstantBooking, ServiceListing, Provider]),
    UsersModule,
    NotificationsModule,
  ],
  controllers: [InstantBookingsController, BookingQueueController],
  providers: [InstantBookingsService],
  exports: [InstantBookingsService],
})
export class InstantBookingsModule {}
