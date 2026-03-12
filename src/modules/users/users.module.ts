import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { ProvidersVerificationController } from './providers-verification.controller';
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
import { ProviderSkillTestResult } from './entities/provider-skill-test-result.entity';
import { ProviderRankingService } from './services/provider-ranking.service';
import { ProviderTrustScoreService } from './services/provider-trust-score.service';
import { ProviderAdService } from './services/provider-ad.service';
import { UserDeviceTokenService } from './services/user-device-token.service';
import { ProviderSkillTestService } from './services/provider-skill-test.service';
import { KycCompleteService } from './services/kyc-complete.service';
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
      ProviderSkillTestResult,
      TrustScore,
      ServiceCategory,
    ]),
  ],
  controllers: [UsersController, ProvidersVerificationController],
  providers: [
    UsersService,
    ProviderRankingService,
    ProviderAdService,
    UserDeviceTokenService,
    ProviderTrustScoreService,
    ProviderSkillTestService,
    KycCompleteService,
  ],
  exports: [
    UsersService,
    ProviderRankingService,
    ProviderAdService,
    UserDeviceTokenService,
    ProviderTrustScoreService,
    ProviderSkillTestService,
    KycCompleteService,
  ],
})
export class UsersModule {}
