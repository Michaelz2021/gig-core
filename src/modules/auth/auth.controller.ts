import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
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
    summary: '사용자 등록 (OTP 전송)',
    description: `새로운 사용자를 등록합니다. 등록 시 OTP가 전화번호로 전송되고 이메일 인증 링크가 이메일로 전송됩니다.
    
**필수 필드:**
- email: 사용자 이메일 주소 (고유값)
- phone: 필리핀 전화번호 (고유값, 형식: +639XXXXXXXXX, 09XXXXXXXXX, 또는 9XXXXXXXXX)
- firstName: 이름
- lastName: 성
- password: 비밀번호 (최소 8자)

**선택 필드:**
- role: 사용자 역할 (consumer, provider, both) - 기본값: consumer
- serviceCategoryIds: 전문 분야 서비스 카테고리 ID 배열 (최대 3개)

**응답:**
- 성공 시: OTP 전송 확인 메시지 및 개발 환경에서만 OTP 코드 반환
- 실패 시: 상세한 에러 메시지 반환`,
  })
  @ApiResponse({
    status: 200,
    description: '등록 성공 - OTP가 전송되었습니다.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'OTP sent to your phone and verification email sent' },
        phone: { type: 'string', example: '+639123456789' },
        email: { type: 'string', example: 'user@example.com' },
        smsSent: { type: 'boolean', example: true },
        otp: { type: 'string', example: '123456', description: '개발 환경에서만 반환됨' },
        emailVerificationToken: { type: 'string', example: 'token-here', description: '개발 환경에서만 반환됨' },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: '이메일이 이미 등록되어 있습니다.',
  })
  @ApiResponse({
    status: 410,
    description: '전화번호가 이미 등록되어 있습니다.',
  })
  @ApiResponse({
    status: 411,
    description: '잘못된 이메일 형식입니다.',
  })
  @ApiResponse({
    status: 412,
    description: '잘못된 전화번호 형식입니다.',
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (서비스 카테고리 ID 유효성 검증 실패 등)',
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
