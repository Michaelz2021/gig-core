import { Injectable, HttpException, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto, RegisterRole } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserType, UserStatus } from '../users/entities/user.entity';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';
import { PhoneValidator } from '../../common/utils/phone-validator';
import { DataSource } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly smsService: SmsService,
    private readonly emailService: EmailService,
    @Inject('REDIS_CLIENT') private readonly redisClient: any,
    private readonly dataSource: DataSource,
  ) {}

  async register(registerDto: RegisterDto) {
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
    console.log('[AuthService] Checking email duplication for:', registerDto.email);
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      console.log('[AuthService] Email already exists:', registerDto.email, 'User ID:', existingUser.id);
      throw new ConflictException({
        message: 'Registration failed: email already registered',
        errors: {
          email: 'This email address is already in use.',
        },
      });
    }
    console.log('[AuthService] Email is available:', registerDto.email);
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
      { email: registerDto.email, type: 'email_verification' },
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
      const emailResult = await this.emailService.sendVerificationEmail(registerDto.email, emailVerificationToken);
      emailSent = emailResult.success === true;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      console.log(`[EMAIL VERIFICATION TOKEN] Email: ${registerDto.email}, Token: ${emailVerificationToken}`);
    }
    if (!emailSent) {
      console.log(`[EMAIL VERIFICATION TOKEN] Email: ${registerDto.email}, Token: ${emailVerificationToken}`);
    }
    if (this.redisClient) {
      const otpKey = `otp:${registerDto.phone}`;
      await this.redisClient.setEx(otpKey, 300, otp);
      const emailTokenKey = `email_verification:${registerDto.email}`;
      await this.redisClient.setEx(emailTokenKey, 24 * 60 * 60, emailVerificationToken);
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
      email: registerDto.email,
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
    return {
      message: smsSent
        ? 'OTP sent to your phone and verification email sent'
        : 'Registration successful. Verification email sent. (SMS OTP will be sent later)',
      phone: registerDto.phone,
      email: registerDto.email,
      smsSent,
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
      emailVerificationToken: process.env.NODE_ENV === 'development' ? emailVerificationToken : undefined,
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
      const email = payload.email;
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
      }
      await this.usersService.update(user.id, {
        isEmailVerified: true,
      });
      if (this.redisClient) {
        const emailTokenKey = `email_verification:${email}`;
        await this.redisClient.del(emailTokenKey);
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
    const storedOtp = await this.redisClient.get(otpKey);
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
    await this.redisClient.del(otpKey);
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
    console.log('[AuthService] Login attempt for email:', loginDto.email);
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      console.log('[AuthService] Login failed: Invalid credentials for email:', loginDto.email);
      throw new UnauthorizedException('Invalid credentials');
    }
    console.log('[AuthService] Login successful for user:', user.id, user.email);
    const payload = { email: user.email, sub: user.id, userType: user.userType };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '30d' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '90d' });
    await this.usersService.update(user.id, { lastLoginAt: new Date() });
    return {
      accessToken,
      refreshToken,
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
        const blacklistedKey = `blacklist:refresh:${refreshToken}`;
        const isBlacklisted = await this.redisClient.get(blacklistedKey);
        if (isBlacklisted) {
          throw new UnauthorizedException('Refresh token has been revoked');
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
        const refreshTokenKey = `refresh_token:${user.id}`;
        await this.redisClient.setEx(refreshTokenKey, 90 * 24 * 60 * 60, newRefreshToken);
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
}
