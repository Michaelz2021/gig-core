import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  Delete,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserDeviceTokenService } from './services/user-device-token.service';
import { ProviderRankingService } from './services/provider-ranking.service';
import { ProviderAdService } from './services/provider-ad.service';
import { User } from './entities/user.entity';
import { UserBankAccount } from './entities/user-bank-account.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { IdVerificationDto } from './dto/id-verification.dto';
import { CertificateVerificationDto } from './dto/certificate-verification.dto';
import { PortfolioSubmissionDto } from './dto/portfolio-submission.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { CreateProviderAdDto } from './dto/create-provider-ad.dto';
import { GetProvidersDto } from './dto/get-providers.dto';
import { TopTierProvidersResponseDto } from './dto/top-tier-provider-response.dto';
import { ProviderAdsListResponseDto } from './dto/provider-ad-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userDeviceTokenService: UserDeviceTokenService,
    private readonly providerRankingService: ProviderRankingService,
    private readonly providerAdService: ProviderAdService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully', type: User })
  async getMe(@GetUser() user: any) {
    return this.usersService.findOne(user.id);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get profile (API spec compatible)' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@GetUser() user: any) {
    const userData = await this.usersService.findOne(user.id);
    return {
      userId: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phoneNumber: userData.phone,
      userType: userData.userType,
      profileImage: userData.profileImage,
      trustScore: (userData as any).trustScore || 0,
      gender: userData.gender || null,
      kycLevel: userData.kycLevel || 'basic',
      isEmailVerified: userData.isEmailVerified || false,
      isPhoneVerified: userData.isPhoneVerified || false,
      isIdVerified: userData.isIdVerified || false,
      twoFactorEnabled: userData.twoFactorEnabled || false,
      status: userData.status || 'active',
      serviceCategoryIds: userData.serviceCategoryIds || [],
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };
  }

  @Post('me/device-token')
  @ApiOperation({
    summary: 'Register device token for push notifications',
    description: 'FCM 디바이스 토큰을 등록합니다. 앱 모드(consumer/provider)와 플랫폼 정보를 함께 전송해야 합니다.',
  })
  @ApiResponse({
    status: 201,
    description: 'Device token registered successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Device token registered successfully' },
        deviceTokens: {
          type: 'array',
          items: { type: 'string' },
          description: '해당 사용자의 모든 활성 디바이스 토큰 목록',
        },
      },
    },
  })
  async registerDeviceToken(
    @GetUser() user: any,
    @Body() registerDeviceTokenDto: RegisterDeviceTokenDto,
  ) {
    // UserDeviceTokenService를 사용하여 새로운 방식으로 토큰 등록
    const deviceToken = await this.userDeviceTokenService.registerDeviceToken(
      user.id,
      registerDeviceTokenDto.deviceToken,
      registerDeviceTokenDto.appMode,
      registerDeviceTokenDto.platform,
      registerDeviceTokenDto.deviceId,
    );

    // 기존 방식과의 호환성을 위해 모든 활성 토큰 반환
    const allTokens = await this.userDeviceTokenService.getActiveTokens(user.id);

    return {
      message: 'Device token registered successfully',
      deviceTokens: allTokens,
    };
  }

  @Delete('me/device-token/:deviceToken')
  @ApiOperation({
    summary: 'Remove device token',
    description: '등록된 디바이스 토큰을 제거합니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'Device token removed successfully',
  })
  async removeDeviceToken(
    @GetUser() user: any,
    @Param('deviceToken') deviceToken: string,
  ) {
    // UserDeviceTokenService를 사용하여 토큰 제거
    await this.userDeviceTokenService.removeDeviceToken(user.id, deviceToken);
    return { message: 'Device token removed successfully' };
  }

  @Get('me/device-tokens')
  @ApiOperation({ 
    summary: 'Get my device tokens',
    description: '현재 로그인한 사용자의 모든 앱 모드(consumer/provider) 활성 디바이스 토큰 목록을 조회합니다.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Device tokens retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        deviceTokens: {
          type: 'array',
          items: { type: 'string' },
          description: '활성 디바이스 토큰 배열',
        },
      },
    },
  })
  async getDeviceTokens(@GetUser() user: any) {
    // UserDeviceTokenService를 사용하여 모든 활성 토큰 조회
    const tokens = await this.userDeviceTokenService.getActiveTokens(user.id);
    return { deviceTokens: tokens };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update my profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully', type: User })
  async updateMe(@GetUser() user: any, @Body() updateData: UpdateUserDto) {
    return this.usersService.update(user.id, updateData);
  }

  @Get('providers/top-tier')
  @ApiOperation({
    summary: 'Get top tier service providers',
    description: 'Top Tier 서비스 제공자 목록을 조회합니다. 랭킹 순위에 따라 정렬된 상위 제공자들을 반환합니다.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '반환할 최대 개수 (기본값: 10, 최대: 10)',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Top tier providers retrieved successfully',
    type: TopTierProvidersResponseDto,
  })
  async getTopTierProviders(@Query('limit') limit?: number) {
    const actualLimit = limit ? Math.min(parseInt(String(limit), 10), 10) : 10;
    return this.providerRankingService.getTopTierProviders(actualLimit);
  }

  @Get('providers/ads')
  @ApiOperation({
    summary: 'Get service provider promotion ads',
    description: '활성화된 서비스 제공자 홍보 광고 목록을 조회합니다. 노출 기간 내이고 우선순위가 높은 광고부터 반환됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'Provider ads retrieved successfully',
    type: ProviderAdsListResponseDto,
  })
  async getProviderAds() {
    return this.providerAdService.findAll();
  }

  @Get('providers')
  @ApiOperation({
    summary: 'Get service providers list',
    description: '서비스 제공자 목록을 조회합니다. 필터링, 정렬, 페이지네이션을 지원합니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'Providers retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        providers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              providerId: { type: 'string' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              title: { type: 'string' },
              profileImage: { type: 'string', nullable: true },
              trustScore: { type: 'number' },
              rating: { type: 'number' },
              reviewCount: { type: 'number' },
              jobsCompleted: { type: 'number' },
              responseRate: { type: 'number' },
              avgResponseTime: { type: 'string' },
              skills: { type: 'array', items: { type: 'string' } },
              hourlyRate: { type: 'number' },
              location: { type: 'string' },
              isOnline: { type: 'boolean' },
              lastActive: { type: 'string', format: 'date-time' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            currentPage: { type: 'number' },
            totalPages: { type: 'number' },
            totalItems: { type: 'number' },
            itemsPerPage: { type: 'number' },
          },
        },
      },
    },
  })
  async getProviders(@Query() query: GetProvidersDto) {
    // 기본값 설정: limit=5, sortBy='newest'
    const limit = query.limit || 5;
    const sortBy = query.sortBy || 'newest';
    
    return this.usersService.findAllProviders({
      ...query,
      limit,
      sortBy,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully', type: User })
  async getPublicProfile(@Param('id') userId: string) {
    return this.usersService.findOne(userId);
  }
}