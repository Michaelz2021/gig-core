import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceListing } from './entities/service-listing.entity';
import { ServiceVariant } from './entities/service-variant.entity';
import { ServiceAddonGroup } from './entities/service-addon-group.entity';
import { ServiceAddonItem } from './entities/service-addon-item.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { InstantServiceList } from '../instant-service-list/entities/instant-service-list.entity';
import { ListingsController } from './listings.controller';
import { MylistingsController } from './mylistings.controller';
import { ServicesOptionsController } from './services-options.controller';
import { ListingsService } from './listings.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceListing, ServiceVariant, ServiceAddonGroup, ServiceAddonItem, Booking, InstantServiceList]),
    UsersModule,
  ],
  controllers: [ListingsController, MylistingsController, ServicesOptionsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
