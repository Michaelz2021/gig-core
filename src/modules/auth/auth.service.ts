import { Injectable, HttpException, ConflictException, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ProviderTrustScoreService } from '../users/services/provider-trust-score.service';
import { RegisterDto, RegisterRole } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserType, UserStatus } from '../users/entities/user.entity';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';
import { PhoneValidator } from '../../common/utils/phone-validator';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
    private readonly providerTrustScoreService: ProviderTrustScoreService,
    @Inject('REDIS_CLIENT') private readonly redisClient: any,
    private readonly dataSource: DataSource,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      return await this.registerInternal(registerDto);
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      if (typeof msg === 'string' && (msg.includes('client is closed') || msg.includes('The client is closed'))) {
        console.error('[AuthService] Redis client closed during register:', msg);
        throw new HttpException(
          { message: 'Registration could not be completed due to a temporary service issue. Please try again in a moment.' },
          503,
        );
      }
      throw err;
    }
  }

  private async registerInternal(registerDto: RegisterDto) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!registerDto.email || !emailRegex.test(registerDto.email)) {
      throw new HttpException(
        {
          message: 'Registration failed: invalid email format',
          errors: {
            email: 'Please provide a valid email address.',
          },
        },
        411,
      );
    }
    const email = registerDto.email.trim().toLowerCase();
    console.log('[AuthService] Checking email duplication for:', email);
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      console.log('[AuthService] Email already exists:', email, 'User ID:', existingUser.id);
      throw new ConflictException({
        message: 'Registration failed: email already registered',
        errors: {
          email: 'This email address is already in use.',
        },
      });
    }
    console.log('[AuthService] Email is available:', email);
    if (!registerDto.phone) {
      throw new HttpException(
        {
          message: 'Registration failed: phone number is required',
          errors: {
            phone: 'Phone number is required for registration.',
          },
        },
        412,
      );
    }
    if (!PhoneValidator.isValidPhilippineMobile(registerDto.phone)) {
      throw new HttpException(
        {
          message: 'Registration failed: invalid Philippine mobile number format',
          errors: {
            phone: 'Phone must be a valid Philippine mobile number in +639XXXXXXXXX, 09XXXXXXXXX, or 9XXXXXXXXX format.',
          },
        },
        412,
      );
    }
    console.log('[AuthService] Checking phone duplication for:', registerDto.phone);
    const existingPhone = await this.usersService.findByPhone(registerDto.phone);
    if (existingPhone) {
      console.log('[AuthService] Phone already exists:', registerDto.phone, 'User ID:', existingPhone.id);
      throw new HttpException(
        {
          message: 'Registration failed: phone number already registered',
          errors: {
            phone: 'This phone number is already in use.',
          },
        },
        410,
      );
    }
    console.log('[AuthService] Phone is available:', registerDto.phone);
    const role = registerDto.role || RegisterRole.CONSUMER;
    let userType: UserType;
    switch (role) {
      case RegisterRole.CONSUMER:
        userType = UserType.CONSUMER;
        break;
      case RegisterRole.PROVIDER:
        userType = UserType.PROVIDER;
        break;
      case RegisterRole.BOTH:
        userType = UserType.BOTH;
        break;
      default:
        throw new BadRequestException({
          message: 'Registration failed: invalid role',
          errors: {
            role: 'Role must be one of: consumer, provider, both',
          },
        });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const emailVerificationToken = this.jwtService.sign(
      { email, type: 'email_verification' },
      { expiresIn: '24h' },
    );
    let smsSent = false;
    try {
      await this.smsService.sendOTP(registerDto.phone, otp);
      smsSent = true;
    } catch (error) {
      console.error('Failed to send OTP SMS:', error);
    }
    let emailSent = false;
    try {
      const emailResult = await this.emailService.sendVerificationEmail(email, emailVerificationToken);
      emailSent = emailResult.success === true;
      console.log(`[AuthService] SendGrid verification email sent: ${emailSent}, to: ${email}${emailResult.messageId ? `, messageId=${emailResult.messageId}` : ''}`);
    } catch (error) {
      console.error('[AuthService] Failed to send verification email:', error);
      console.log(`[AuthService] SendGrid verification email sent: false, to: ${email}`);
      console.log(`[EMAIL VERIFICATION TOKEN] Email: ${email}, Token: ${emailVerificationToken}`);
    }
    if (!emailSent) {
      console.log(`[EMAIL VERIFICATION TOKEN] Email: ${email}, Token: ${emailVerificationToken}`);
    }
    const redisReady = this.redisClient && (this.redisClient.isReady === true);
    if (redisReady) {
      try {
        const otpKey = `otp:${registerDto.phone}`;
        await this.redisClient.setEx(otpKey, 300, otp);
        const emailTokenKey = `email_verification:${email}`;
        await this.redisClient.setEx(emailTokenKey, 24 * 60 * 60, emailVerificationToken);
      } catch (redisErr: any) {
        console.error('[AuthService] Redis unavailable during register (OTP/email token not stored):', redisErr?.message ?? redisErr);
      }
    } else if (this.redisClient) {
      console.warn('[AuthService] Redis client not ready (closed or disconnected); OTP/email token not stored.');
    }
    let validatedServiceCategoryIds: string[] = [];
    if (registerDto.serviceCategoryIds && registerDto.serviceCategoryIds.length > 0) {
      const uniqueIds = [...new Set(registerDto.serviceCategoryIds)];
      if (uniqueIds.length !== registerDto.serviceCategoryIds.length) {
        throw new HttpException(
          {
            message: 'Registration failed: duplicate service category IDs',
            errors: {
              serviceCategoryIds: '중복된 서비스 카테고리가 포함되어 있습니다.',
            },
          },
          400,
        );
      }
      if (uniqueIds.length > 3) {
        throw new HttpException(
          {
            message: 'Registration failed: too many service categories',
            errors: {
              serviceCategoryIds: '최대 3개의 서비스 카테고리만 선택할 수 있습니다.',
            },
          },
          400,
        );
      }
      const placeholders = uniqueIds.map((_, index) => `$${index + 1}`).join(', ');
      const validCategories = await this.dataSource.query(
        `SELECT id FROM service_categories WHERE id IN (${placeholders}) AND is_active = true`,
        uniqueIds,
      );
      const validCategoryIds = validCategories.map((cat: any) => cat.id);
      const invalidIds = uniqueIds.filter((id) => !validCategoryIds.includes(id));
      if (invalidIds.length > 0) {
        throw new HttpException(
          {
            message: 'Registration failed: invalid service category',
            errors: {
              serviceCategoryIds: `다음 서비스 카테고리가 존재하지 않거나 비활성화되어 있습니다: ${invalidIds.join(', ')}`,
            },
          },
          400,
        );
      }
      validatedServiceCategoryIds = uniqueIds;
    }
    const user = await this.usersService.create({
      email,
      phone: registerDto.phone,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      password: registerDto.password,
      userType,
      isEmailVerified: false,
      isPhoneVerified: false,
      status: UserStatus.ACTIVE,
      serviceCategoryIds: validatedServiceCategoryIds.length > 0 ? validatedServiceCategoryIds : [],
    });
    const message =
      smsSent && emailSent
        ? 'OTP sent to your phone and verification email sent'
        : smsSent && !emailSent
          ? 'OTP sent to your phone. Verification email could not be sent; you can request a new link later.'
          : !smsSent && emailSent
            ? 'Registration successful. Verification email sent. (SMS OTP will be sent later)'
            : 'Registration successful. Verification email could not be sent; you can request a new link later. (SMS OTP will be sent later)';

    return {
      message,
      phone: registerDto.phone,
      email,
      smsSent,
      emailSent,
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
      emailVerificationToken: process.env.NODE_ENV === 'development' ? emailVerificationToken : undefined,
    };
  }

  /**
   * 특정 번호로 테스트 OTP SMS 전송 (Swagger에서 사용)
   */
  async sendTestOtp(phone: string) {
    if (!PhoneValidator.isValidPhilippineMobile(phone)) {
      throw new BadRequestException({
        message: 'Test OTP failed: invalid Philippine mobile number format',
        errors: {
          phone: 'Phone must be a valid Philippine mobile number in +639XXXXXXXXX, 09XXXXXXXXX, or 9XXXXXXXXX format.',
        },
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      const result = await this.smsService.sendOTP(phone, otp);
      return {
        message: 'Test OTP SMS sent',
        phone,
        otp: process.env.NODE_ENV === 'development' ? otp : undefined,
        smsResult: result,
      };
    } catch (error: any) {
      console.error('[AuthService] Failed to send test OTP SMS:', error);
      throw new HttpException(
        {
          message: 'Failed to send test OTP SMS',
          error: error?.message ?? String(error),
        },
        500,
      );
    }
  }

  /**
   * JWT로 식별된 사용자의 DB 등록 전화번호로 SMS OTP 발송.
   * Redis에 otp:${phone} 으로 저장하여 verify-otp에서 검증.
   */
  async requestOtp(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new BadRequestException({
        message: 'User not found',
        errors: { user: 'User not found.' },
      });
    }
    const phone = user.phone;
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      throw new BadRequestException({
        message: 'Phone number not registered',
        errors: {
          phone: 'No mobile number is registered for this account. Please update your profile with a Philippine mobile number.',
        },
      });
    }
    const trimmedPhone = phone.trim();
    if (!PhoneValidator.isValidPhilippineMobile(trimmedPhone)) {
      throw new BadRequestException({
        message: 'Invalid phone format',
        errors: {
          phone: 'Registered mobile number format is invalid. Please update your profile with a valid Philippine mobile number.',
        },
      });
    }
    if (!this.redisClient) {
      throw new BadRequestException({
        message: 'OTP service unavailable',
        errors: {
          otp: 'OTP service is temporarily unavailable. Please try again later.',
        },
      });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpKey = `otp:${trimmedPhone}`;
    try {
      await this.redisClient.setEx(otpKey, 300, otp);
    } catch (redisErr: any) {
      console.error('[AuthService] Redis unavailable during requestOtp:', redisErr?.message ?? redisErr);
      throw new BadRequestException({
        message: 'OTP service unavailable',
        errors: {
          otp: 'OTP service is temporarily unavailable. Please try again later.',
        },
      });
    }
    let smsSent = false;
    try {
      await this.smsService.sendOTP(trimmedPhone, otp);
      smsSent = true;
    } catch (error: any) {
      console.error('[AuthService] Failed to send OTP SMS in requestOtp:', error);
      try {
        await this.redisClient.del(otpKey);
      } catch {
        // best-effort
      }
      throw new HttpException(
        {
          message: 'Failed to send OTP SMS',
          error: error?.message ?? String(error),
        },
        500,
      );
    }
    return {
      message: 'OTP sent to your registered mobile number',
      phone: trimmedPhone,
      smsSent: true,
      ...(process.env.NODE_ENV === 'development' ? { otp } : {}),
    };
  }

  async verifyEmail(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'email_verification') {
        throw new BadRequestException({
          message: 'Email verification failed: invalid token type',
          errors: {
            token: 'Invalid verification token.',
          },
        });
      }
      const email = (payload.email || '').trim().toLowerCase();
      if (!email) {
        throw new BadRequestException({
          message: 'Email verification failed: email not found in token',
          errors: {
            token: 'Invalid verification token.',
          },
        });
      }
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new BadRequestException({
          message: 'Email verification failed: user not found',
          errors: {
            email: 'User not found for this email address.',
          },
        });
      }
      if (user.isEmailVerified) {
        return {
          message: 'Email already verified',
          email: user.email,
          isEmailVerified: true,
        };
      }
      if (this.redisClient) {
        try {
          const emailTokenKey = `email_verification:${email}`;
          const storedToken = await this.redisClient.get(emailTokenKey);
          if (storedToken && storedToken !== token) {
            throw new BadRequestException({
              message: 'Email verification failed: token mismatch',
              errors: {
                token: 'Invalid or expired verification token.',
              },
            });
          }
        } catch (err) {
          if (err instanceof BadRequestException) throw err;
          console.error('[AuthService] Redis unavailable during verifyEmail (skip token check):', (err as any)?.message);
        }
      }
      await this.usersService.update(user.id, {
        isEmailVerified: true,
      });
      await this.usersService.ensureProviderRowIfFullyVerified(user.id);
      await this.providerTrustScoreService.recalculateByUserId(user.id).catch(() => {});
      if (this.redisClient) {
        try {
          const emailTokenKey = `email_verification:${email}`;
          await this.redisClient.del(emailTokenKey);
        } catch {
          // best-effort
        }
      }
      return {
        message: 'Email verified successfully',
        email: user.email,
        isEmailVerified: true,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        message: 'Email verification failed: invalid or expired token',
        errors: {
          token: 'The verification token is invalid or has expired. Please request a new verification email.',
        },
      });
    }
  }

  /**
   * Forgot password OTP: send OTP (email or phone) or verify OTP.
   * Body: otpType ('email'|'phone'), email? (when otpType=email), phone? (when otpType=phone), otp? (when verifying).
   */
  async forgotOtp(dto: { otpType: 'email' | 'phone'; email?: string; phone?: string; otp?: string }) {
    const otpType = dto.otpType?.toLowerCase() as 'email' | 'phone';
    if (!otpType || !['email', 'phone'].includes(otpType)) {
      throw new BadRequestException({ message: 'otpType must be email or phone', errors: { otpType: 'Invalid otpType' } });
    }

    // Verification mode: otp provided -> check Redis and return verified
    if (dto.otp != null && String(dto.otp).trim().length === 6) {
      if (!this.redisClient) {
        throw new BadRequestException({ message: 'OTP verification unavailable', errors: { otp: 'Service temporarily unavailable' } });
      }
      const key = otpType === 'email'
        ? `forgot_otp:email:${(dto.email || '').trim().toLowerCase()}`
        : `forgot_otp:phone:${String(dto.phone || '').trim()}`;
      let stored: string | null = null;
      try {
        stored = await this.redisClient.get(key);
      } catch (e) {
        throw new BadRequestException({ message: 'OTP verification unavailable', errors: { otp: 'Service temporarily unavailable' } });
      }
      if (!stored || stored !== dto.otp.trim()) {
        throw new BadRequestException({ message: 'Invalid or expired OTP', errors: { otp: 'The OTP code is invalid or has expired.' } });
      }
      try {
        await this.redisClient.del(key);
        const approvedKey = otpType === 'email'
          ? `forgot_otp:approved:email:${(dto.email || '').trim().toLowerCase()}`
          : `forgot_otp:approved:phone:${String(dto.phone || '').trim()}`;
        await this.redisClient.setEx(approvedKey, 600, '1');
      } catch {}
      return { success: true, verified: true, message: 'OTP verified. You can now update your password.' };
    }

    // Send mode
    if (!this.redisClient) {
      throw new BadRequestException({ message: 'OTP send service unavailable', errors: { otp: 'Service temporarily unavailable. Please try again later.' } });
    }

    if (otpType === 'email') {
      const email = (dto.email || '').trim().toLowerCase();
      if (!email) {
        throw new BadRequestException({ message: 'Email is required when otpType is email', errors: { email: 'Email is required' } });
      }
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new BadRequestException({ message: 'No account found with this email', errors: { email: 'No account found. Please register first.' } });
      }
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const key = `forgot_otp:email:${email}`;
      await this.redisClient.setEx(key, 300, otp);
      const result = await this.emailService.sendOtpEmail(email, otp);
      if (!result.success) {
        throw new BadRequestException({ message: 'Failed to send OTP email', errors: { email: result.error || 'Try again later.' } });
      }
      return { success: true, message: 'OTP sent to your email.', ...(process.env.NODE_ENV === 'development' ? { otp } : {}) };
    }

    // phone
    const phone = String(dto.phone || '').trim();
    if (!phone) {
      throw new BadRequestException({ message: 'Phone is required when otpType is phone', errors: { phone: 'Phone is required' } });
    }
    if (!PhoneValidator.isValidPhilippineMobile(phone)) {
      throw new BadRequestException({ message: 'Invalid Philippine mobile number', errors: { phone: 'Invalid phone format' } });
    }
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new BadRequestException({ message: 'No account found with this phone number', errors: { phone: 'No account found. Please register first.' } });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `forgot_otp:phone:${phone}`;
    await this.redisClient.setEx(key, 300, otp);
    await this.smsService.sendOTP(phone, otp);
    return { success: true, message: 'OTP sent to your phone.', ...(process.env.NODE_ENV === 'development' ? { otp } : {}) };
  }

  /**
   * OTP 승인 후 비밀번호 변경. Redis forgot_otp:approved:{email|phone}:{id} 확인 후 사용자 비밀번호 업데이트.
   */
  async updatePassword(dto: { otpType: 'email' | 'phone'; email?: string; phone?: string; password: string }) {
    if (!this.redisClient) {
      throw new UnauthorizedException('Password update is temporarily unavailable.');
    }
    const otpType = (dto.otpType || '').toLowerCase() as 'email' | 'phone';
    if (!['email', 'phone'].includes(otpType)) {
      throw new BadRequestException('otpType must be email or phone');
    }
    const email = otpType === 'email' ? (dto.email || '').trim().toLowerCase() : undefined;
    const phone = otpType === 'phone' ? String(dto.phone || '').trim() : undefined;
    if (otpType === 'email' && !email) {
      throw new BadRequestException('email is required when otpType is email');
    }
    if (otpType === 'phone' && !phone) {
      throw new BadRequestException('phone is required when otpType is phone');
    }
    const approvedKey = otpType === 'email'
      ? `forgot_otp:approved:email:${email}`
      : `forgot_otp:approved:phone:${phone}`;
    const approved = await this.redisClient.get(approvedKey);
    if (!approved) {
      throw new UnauthorizedException('Forgot OTP approval is missing or expired. Please verify OTP again.');
    }
    const user = otpType === 'email'
      ? await this.usersService.findByEmail(email!)
      : await this.usersService.findByPhone(phone!);
    if (!user) {
      throw new BadRequestException('User not found.');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 12);
    await this.usersService.update(user.id, { password: hashedPassword });
    await this.redisClient.del(approvedKey).catch(() => {});
    return { success: true, message: 'Password updated successfully.' };
  }

  async verifyOtp(phone: string, otp: string) {
    if (!this.redisClient) {
      throw new BadRequestException({
        message: 'OTP verification failed: service not available',
        errors: {
          otp: 'OTP verification service is temporarily unavailable. Please try again later.',
        },
      });
    }
    const otpKey = `otp:${phone}`;
    let storedOtp: string | null;
    try {
      storedOtp = await this.redisClient.get(otpKey);
    } catch (redisErr: any) {
      console.error('[AuthService] Redis unavailable during verifyOtp:', redisErr?.message ?? redisErr);
      throw new BadRequestException({
        message: 'OTP verification failed: service not available',
        errors: {
          otp: 'OTP verification service is temporarily unavailable. Please try again later.',
        },
      });
    }
    if (!storedOtp || storedOtp !== otp) {
      throw new BadRequestException({
        message: 'OTP verification failed: invalid or expired code',
        errors: {
          otp: 'The OTP code is invalid or has expired. Please request a new code.',
        },
      });
    }
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new BadRequestException({
        message: 'OTP verification failed: user not found',
        errors: {
          phone: 'User not found for this phone number. Please register again.',
        },
      });
    }
    await this.usersService.update(user.id, {
      isPhoneVerified: true,
    });
    await this.usersService.ensureProviderRowIfFullyVerified(user.id);
    await this.providerTrustScoreService.recalculateByUserId(user.id).catch(() => {});
    try {
      await this.redisClient.del(otpKey);
    } catch {
      // best-effort; verification already succeeded
    }
    return {
      message: 'OTP verified successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        isPhoneVerified: true,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const loginType = (loginDto['login-type'] ?? loginDto.userType ?? loginDto['user-type'])?.toLowerCase();
    const usePhoneLogin = loginType === 'phone' && loginDto.phone && String(loginDto.phone).trim() !== '';

    let user: any = null;
    if (usePhoneLogin) {
      // 전화번호 로그인: users 테이블에서 phone으로 조회 후 비밀번호 비교
      console.log('[AuthService] Login attempt for phone:', loginDto.phone);
      user = await this.validateUserByPhone(loginDto.phone!.trim(), loginDto.password);
    } else {
      // 이메일 로그인: users 테이블에서 email로 조회 후 비밀번호 비교
      if (!loginDto.email?.trim()) {
        throw new BadRequestException('email or phone is required. For phone login use login-type: "phone" and phone.');
      }
      console.log('[AuthService] Login attempt for email:', loginDto.email);
      user = await this.validateUser(loginDto.email!.trim(), loginDto.password);
    }
    if (!user) {
      console.log('[AuthService] Login failed: Invalid credentials');
      throw new UnauthorizedException('Invalid credentials');
    }

    // 앱 컨텍스트(user-type / login-type) 검증: 요청한 앱을 이 사용자가 사용할 수 있는지 확인
    const requestedContext = (
      loginDto.userType ??
      loginDto['user-type'] ??
      loginDto['login-type']
    )?.toLowerCase();
    if (requestedContext) {
      const canUseConsumer = user.userType === UserType.CONSUMER || user.userType === UserType.BOTH;
      const canUseProvider = user.userType === UserType.PROVIDER || user.userType === UserType.BOTH;
      if (requestedContext === 'consumer' && !canUseConsumer) {
        throw new ForbiddenException('This account does not have consumer access. Use the provider app or register as consumer.');
      }
      if (requestedContext === 'provider' && !canUseProvider) {
        throw new ForbiddenException('This account does not have provider access. Use the consumer app or complete provider registration.');
      }
    }
    const loginAs = requestedContext ?? user.userType;

    console.log('[AuthService] Login successful for user:', user.id, user.email, 'loginAs:', loginAs);

    // 전화번호가 전달된 경우 사용자 정보에 반영 (선택)
    const updateData: { lastLoginAt: Date; phone?: string } = { lastLoginAt: new Date() };
    if (loginDto.phone != null && String(loginDto.phone).trim() !== '') {
      updateData.phone = loginDto.phone.trim();
    }
    await this.usersService.update(user.id, updateData);

    const payload = { email: user.email, sub: user.id, userType: user.userType, loginAs };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '30d' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '90d' });

    return {
      accessToken,
      refreshToken,
      loginAs,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        serviceCategoryIds: user.serviceCategoryIds || [],
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      if (this.redisClient) {
        try {
          const blacklistedKey = `blacklist:refresh:${refreshToken}`;
          const isBlacklisted = await this.redisClient.get(blacklistedKey);
          if (isBlacklisted) {
            throw new UnauthorizedException('Refresh token has been revoked');
          }
        } catch (err) {
          if (err instanceof UnauthorizedException) throw err;
          console.error('[AuthService] Redis unavailable during refreshToken (skip blacklist check):', (err as any)?.message);
        }
      }
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersService.findOne(payload.sub);
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('User not found or inactive');
      }
      const newPayload = { email: user.email, sub: user.id, userType: user.userType };
      const accessToken = this.jwtService.sign(newPayload, { expiresIn: '30d' });
      const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: '90d' });
      if (this.redisClient) {
        try {
          const refreshTokenKey = `refresh_token:${user.id}`;
          await this.redisClient.setEx(refreshTokenKey, 90 * 24 * 60 * 60, newRefreshToken);
        } catch (redisErr: any) {
          console.error('[AuthService] Redis unavailable during refreshToken (token not stored):', redisErr?.message);
        }
      }
      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 30 * 24 * 60 * 60,
        tokenType: 'Bearer',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string, accessToken: string, refreshToken?: string) {
    try {
      const accessTokenExpiry = 30 * 24 * 60 * 60;
      const refreshTokenExpiry = refreshToken ? 90 * 24 * 60 * 60 : 0;
      if (this.redisClient) {
        const accessTokenKey = `blacklist:access:${accessToken}`;
        await this.redisClient.setEx(accessTokenKey, accessTokenExpiry, '1');
        if (refreshToken) {
          const refreshTokenKey = `blacklist:refresh:${refreshToken}`;
          await this.redisClient.setEx(refreshTokenKey, refreshTokenExpiry, '1');
        }
        const userRefreshTokenKey = `refresh_token:${userId}`;
        await this.redisClient.del(userRefreshTokenKey);
      }
      return {
        message: 'Logged out successfully',
        success: true,
      };
    } catch (error) {
      return {
        message: 'Logged out successfully',
        success: true,
      };
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    console.log('[AuthService] validateUser called for email:', email);
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      console.log('[AuthService] User not found for email:', email);
      return null;
    }
    console.log('[AuthService] User found:', user.id, user.email);
    console.log('[AuthService] User status:', user.status);
    console.log('[AuthService] User has password hash:', !!user.password);
    if (user.status && user.status !== UserStatus.ACTIVE) {
      console.log('[AuthService] User is not active. Status:', user.status);
      return null;
    }
    const isValidPassword = await (user as any).validatePassword(password);
    console.log('[AuthService] Password validation result:', isValidPassword);
    if (isValidPassword) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async validateUserByPhone(phone: string, password: string): Promise<any> {
    console.log('[AuthService] validateUserByPhone called for phone:', phone);
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      console.log('[AuthService] User not found for phone:', phone);
      return null;
    }
    if (user.status && user.status !== UserStatus.ACTIVE) {
      console.log('[AuthService] User is not active. Status:', user.status);
      return null;
    }
    const isValidPassword = await (user as any).validatePassword(password);
    if (isValidPassword) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }
}
