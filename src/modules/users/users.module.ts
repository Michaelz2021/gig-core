import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { ProviderFavorite } from './entities/provider-favorite.entity';
import { Provider } from './entities/provider.entity';
import { Portfolio } from './entities/portfolio.entity';
import { UserProfile } from './entities/user-profile.entity';
import { UserBankAccount } from './entities/user-bank-account.entity';
import { TopTierProviderRanking } from './entities/top-tier-provider-ranking.entity';
import { ProviderAd } from './entities/provider-ad.entity';
import { UserDeviceToken } from './entities/user-device-token.entity';
import { ProviderRankingService } from './services/provider-ranking.service';
import { ProviderAdService } from './services/provider-ad.service';
import { UserDeviceTokenService } from './services/user-device-token.service';
import { TrustScore } from '../trust-score/entities/trust-score.entity';
import { ServiceCategory } from '../services/entities/service-category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ProviderFavorite,
      Provider,
      Portfolio,
      UserProfile,
      UserBankAccount,
      TopTierProviderRanking,
      ProviderAd,
      UserDeviceToken,
      TrustScore,
      ServiceCategory,
    ]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    ProviderRankingService,
    ProviderAdService,
    UserDeviceTokenService,
  ],
  exports: [
    UsersService,
    ProviderRankingService,
    ProviderAdService,
    UserDeviceTokenService,
  ],
})
export class UsersModule {}
