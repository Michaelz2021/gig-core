import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstantInvoice } from './entities/instant-invoice.entity';
import { Provider } from '../users/entities/provider.entity';
import { InstantInvoicesService } from './instant-invoices.service';
import { InstantInvoicesController } from './instant-invoices.controller';
import { ListingsModule } from '../listings/listings.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InstantInvoice, Provider]),
    ListingsModule,
    UsersModule,
  ],
  controllers: [InstantInvoicesController],
  providers: [InstantInvoicesService],
  exports: [InstantInvoicesService],
})
export class InstantInvoicesModule {}
