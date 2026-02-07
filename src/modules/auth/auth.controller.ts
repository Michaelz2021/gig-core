import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { SendTestOtpDto } from './dto/send-test-otp.dto';
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

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'OTP verification' })
  @ApiResponse({ status: 200, description: 'OTP verification successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto.phone, verifyOtpDto.otp);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Email verification' })
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
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
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
