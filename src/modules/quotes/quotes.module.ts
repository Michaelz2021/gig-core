import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { RfqController } from './rfq.controller';
import { RfqService } from './rfq.service';
import { Quote } from './entities/quote.entity';
import { RFQ } from './entities/rfq.entity';
import { UsersModule } from '../users/users.module';
import { UploadModule } from '../upload/upload.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MatchingModule } from '../matching/matching.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quote, RFQ]),
    UsersModule,
    UploadModule,
    NotificationsModule,
    MatchingModule,
  ],
  controllers: [QuotesController, RfqController],
  providers: [QuotesService, RfqService],
  exports: [QuotesService, RfqService],
})
export class QuotesModule {}
