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
import { ProviderTrustScore } from './entities/provider-trust-score.entity';
import { ProviderRankingService } from './services/provider-ranking.service';
import { ProviderTrustScoreService } from './services/provider-trust-score.service';
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
      ProviderTrustScore,
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
    ProviderTrustScoreService,
  ],
  exports: [
    UsersService,
    ProviderRankingService,
    ProviderAdService,
    UserDeviceTokenService,
    ProviderTrustScoreService,
  ],
})
export class UsersModule {}
