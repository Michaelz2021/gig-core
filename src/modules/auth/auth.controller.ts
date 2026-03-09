import { Controller, Get, Post, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { SendTestOtpDto } from './dto/send-test-otp.dto';
import { ForgotOtpDto } from './dto/forgot-otp.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User registration (sends OTP)',
    description: `Register a new user. OTP is sent to the phone and email verification link is sent to email.

**Required fields:**
- email: User email (unique)
- phone: Philippine phone (unique, format: +639XXXXXXXXX, 09XXXXXXXXX, or 9XXXXXXXXX)
- firstName: First name
- lastName: Last name
- password: Password (min 8 characters)

**Optional fields:**
- role: User role (consumer, provider, both) - default: consumer
- serviceCategoryIds: Service category ID array (max 3)

**Response:**
- Success: OTP sent confirmation; OTP code returned in development only
- Failure: Detailed error message`,
  })
  @ApiResponse({
    status: 200,
    description: 'Registration success - OTP sent.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'OTP sent to your phone and verification email sent' },
        phone: { type: 'string', example: '+639123456789' },
        email: { type: 'string', example: 'user@example.com' },
        smsSent: { type: 'boolean', example: true },
        emailSent: { type: 'boolean', example: true, description: 'Whether the verification email was sent successfully' },
        otp: { type: 'string', example: '123456', description: 'Returned in development only' },
        emailVerificationToken: { type: 'string', example: 'token-here', description: 'Returned in development only' },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Email already registered.',
  })
  @ApiResponse({
    status: 410,
    description: 'Phone number already registered.',
  })
  @ApiResponse({
    status: 411,
    description: 'Invalid email format.',
  })
  @ApiResponse({
    status: 412,
    description: 'Invalid phone format.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request (e.g. service category ID validation failed).',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('request-otp')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Request OTP (SMS)',
    description:
      'JWT로 식별된 사용자의 DB 등록 전화번호(mobile)로 SMS OTP를 발송합니다. 발송된 OTP는 POST /auth/verify-otp 로 검증할 수 있습니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP sent to registered mobile number',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'OTP sent to your registered mobile number' },
        phone: { type: 'string', example: '+639123456789' },
        smsSent: { type: 'boolean', example: true },
        otp: { type: 'string', description: 'Development only' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'No phone registered or invalid format or OTP service unavailable' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async requestOtp(@GetUser() user: { id: string }) {
    return this.authService.requestOtp(user.id);
  }

  @Public()
  @Post('forgot-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Forgot password OTP',
    description: 'Send OTP to email or phone for password reset, or verify OTP (when otp field is provided). Body: otpType (email|phone), email or phone, and optionally otp for verification.',
  })
  @ApiBody({ type: ForgotOtpDto })
  @ApiResponse({ status: 200, description: 'OTP sent or verified' })
  @ApiResponse({ status: 400, description: 'Invalid request or OTP' })
  async forgotOtp(@Body() dto: ForgotOtpDto) {
    return this.authService.forgotOtp(dto);
  }

  @Public()
  @Post('update-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update password after forgot OTP approval',
    description:
      'JWT 없이 호출. 먼저 POST /auth/forgot-otp 에서 otp 를 포함해 OTP 검증 성공 후, 같은 식별자(email/phone)로 새 비밀번호를 보내면 비밀번호가 변경됩니다. Body: otp-type (email|phone), email 또는 phone, password.',
  })
  @ApiBody({
    type: UpdatePasswordDto,
    examples: {
      byEmail: {
        summary: '이메일 계정 비밀번호 변경',
        value: { 'otp-type': 'email', email: 'test@example.com', password: 'NewPassword123!' },
      },
      byPhone: {
        summary: '휴대폰 계정 비밀번호 변경',
        value: { 'otp-type': 'phone', phone: '+639123456789', password: 'NewPassword123!' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or user not found' })
  @ApiResponse({ status: 401, description: 'Forgot OTP approval is missing or expired' })
  async updatePassword(@Body() dto: UpdatePasswordDto) {
    return this.authService.updatePassword(dto);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'OTP verification',
    description: 'Verify phone OTP and set is_phone_verified to true for the user.',
  })
  @ApiResponse({ status: 200, description: 'OTP verification successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto.phone, verifyOtpDto.otp);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Email verification',
    description:
      '이메일 인증 링크의 token으로 계정을 인증합니다. Swagger 테스트 시: 1) POST /auth/register 호출 → 2) 응답의 **emailVerificationToken** 값을 복사 → 3) 아래 token 필드에 붙여넣기 (개발 환경에서만 응답에 토큰이 포함됩니다).',
  })
  @ApiBody({
    type: VerifyEmailDto,
    examples: {
      fromRegister: {
        summary: 'Register 응답에서 복사',
        description: 'POST /auth/register 응답의 emailVerificationToken 값을 그대로 사용',
        value: {
          token:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJ0eXBlIjoiZW1haWxfdmVyaWZpY2F0aW9uIiwiaWF0IjoxNzA4MDAwMDAwLCJleHAiOjE3MDg4NjQwMDB9.signature',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Email verification successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto.token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('test-send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Send test OTP SMS to a specific mobile number (for testing via Swagger)',
    description:
      'Sends a one-time OTP SMS with an English message to the specified Philippine mobile number, without creating a user.\n' +
      'Use this for testing SMS delivery. In development environment, the OTP code is also returned in the response.',
  })
  @ApiResponse({
    status: 200,
    description: 'Test OTP SMS sent',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid phone number format',
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to send test OTP SMS',
  })
  async sendTestOtp(@Body() dto: SendTestOtpDto) {
    return this.authService.sendTestOtp(dto.phone);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login',
    description:
      'email/password로 인증. **user-type**으로 앱 구분(gig-consumer: consumer, gig-provider: provider). ' +
      'phone 전달 시 사용자 전화번호 동기화. consumer 전용 계정은 provider 앱 로그인 시 403.',
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      consumer: {
        summary: 'gig-consumer 앱',
        value: { email: 'test@example.com', password: 'Test1234!', 'user-type': 'consumer' },
      },
      provider: {
        summary: 'gig-provider 앱',
        value: { email: 'provider@example.com', password: 'Test123!', 'user-type': 'provider' },
      },
      withPhone: {
        summary: '전화번호 동기화 포함',
        value: {
          email: 'test@example.com',
          password: 'Test1234!',
          'user-type': 'consumer',
          phone: '+639123456789',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
        loginAs: { type: 'string', enum: ['consumer', 'provider'], description: '이번 로그인 앱 컨텍스트' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            userType: { type: 'string', enum: ['consumer', 'provider', 'both'] },
            serviceCategoryIds: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Requested app context not allowed for this account (e.g. provider app but user is consumer only)' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Token refresh' })
  @ApiResponse({ status: 200, description: 'Token refresh successful' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout - Invalidates access token and optionally refresh token' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@GetUser() user: any, @Req() req: any, @Body() logoutDto?: LogoutDto) {
    const authHeader = req.headers?.authorization;
    const accessToken = authHeader?.replace('Bearer ', '') || '';
    return this.authService.logout(user.id, accessToken, logoutDto?.refreshToken);
  }
}
