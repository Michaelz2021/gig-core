import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsumerProviderController } from './consumer-provider.controller';
import { ConsumerProviderService } from './consumer-provider.service';
import { ConsumerProviderFavorite } from './entities/consumer-provider-favorite.entity';
import { ConsumerProviderReaction } from './entities/consumer-provider-reaction.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConsumerProviderFavorite, ConsumerProviderReaction]),
    UsersModule,
  ],
  controllers: [ConsumerProviderController],
  providers: [ConsumerProviderService],
  exports: [ConsumerProviderService],
})
export class ConsumerProviderModule {}
