import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { VerifyEmailViewController } from './verify-email-view.controller';
import { VerifyEmailResultViewController } from './verify-email-result-view.controller';
import { AuthService } from './auth.service';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RedisModule } from '../../config/redis.module';

@Module({
  imports: [
    UsersModule,
    RedisModule,
    TypeOrmModule.forFeature([]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION', '30d'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, VerifyEmailViewController, VerifyEmailResultViewController],
  providers: [AuthService, SmsService, EmailService, JwtStrategy],
  exports: [AuthService, JwtModule, EmailService, SmsService],
})
export class AuthModule {}
