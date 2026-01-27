import { Module } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ServicesModule } from './modules/services/services.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { MatchingModule } from './modules/matching/matching.module';
import { TrustScoreModule } from './modules/trust-score/trust-score.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MessagesModule } from './modules/messages/messages.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { SearchModule } from './modules/search/search.module';
import { UploadModule } from './modules/upload/upload.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { HealthModule } from './modules/health/health.module';
import { AdminModule } from './modules/admin/admin.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { NoticesModule } from './modules/notices/notices.module';
import { RedisModule } from './config/redis.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const host = configService.get('DB_HOST') || 'localhost';
        const port = configService.get<number>('DB_PORT') || 5432;
        const username = configService.get('DB_USERNAME') || 'postgres';
        const password = configService.get('DB_PASSWORD') || '';
        const database = configService.get('DB_DATABASE') || 'ai_trusttrade';

        return {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
          logging: configService.get('NODE_ENV') === 'development',
          ssl: configService.get('NODE_ENV') === 'production' ? {
            rejectUnauthorized: false,
          } : false,
          // 연결 재시도 설정
          retryAttempts: 5,
          retryDelay: 3000, // 3초
          autoLoadEntities: true,
          // 연결 실패 시 더 명확한 에러 메시지
          extra: {
            max: 10, // 최대 연결 수
            connectionTimeoutMillis: 5000, // 5초 타임아웃
          },
        };
      },
      inject: [ConfigService],
    }),
    
    // Redis
    RedisModule,
    
    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): ThrottlerModuleOptions => ({
        throttlers: [{
          ttl: configService.get<number>('RATE_LIMIT_TTL', 60) * 1000, // 초를 밀리초로 변환
          limit: configService.get<number>('RATE_LIMIT_MAX', 100),
        }],
      }),
      inject: [ConfigService],
    }),
    
    // Feature Modules
    HealthModule,
    AuthModule,
    UsersModule,
    ServicesModule,
    BookingsModule,
    PaymentsModule,
    ReviewsModule,
    MatchingModule,
    TrustScoreModule,
    NotificationsModule,
    MessagesModule,
    DisputesModule,
    QuotesModule,
    SearchModule,
    UploadModule,
    WebhooksModule,
    CategoriesModule,
    AdminModule,
    RewardsModule,
    NoticesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    Reflector,
  ],
})
export class AppModule {}
