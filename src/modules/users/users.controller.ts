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
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserDeviceTokenService } from './services/user-device-token.service';
import { ProviderRankingService } from './services/provider-ranking.service';
import { ProviderAdService } from './services/provider-ad.service';
import { User } from './entities/user.entity';
import { Provider } from './entities/provider.entity';
import { UserBankAccount } from './entities/user-bank-account.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { IdVerificationDto } from './dto/id-verification.dto';
import { CertificateVerificationDto } from './dto/certificate-verification.dto';
import { PortfolioSubmissionDto } from './dto/portfolio-submission.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { CreateProviderAdDto } from './dto/create-provider-ad.dto';
import { UpdateProviderAdDto } from './dto/update-provider-ad.dto';
import { GetProvidersDto } from './dto/get-providers.dto';
import { TopTierProvidersResponseDto } from './dto/top-tier-provider-response.dto';
import { ProviderAdsListResponseDto, ProviderAdResponseDto } from './dto/provider-ad-response.dto';
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
    description: 'Register FCM device token. Send app mode (consumer/provider) and platform info together.',
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
          description: 'List of all active device tokens for the user',
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
    description: 'Remove a registered device token.',
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
    description: 'Get all active device tokens for the current user by app mode (consumer/provider).'
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
          description: 'Array of active device tokens',
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
    description: 'Get top tier service providers. Returns providers sorted by ranking.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number to return (default: 10, max: 10)',
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
    description: 'Get active service provider promotion ads. Returns ads within display period, ordered by priority.',
  })
  @ApiResponse({
    status: 200,
    description: 'Provider ads retrieved successfully',
    type: ProviderAdsListResponseDto,
  })
  async getProviderAds() {
    return this.providerAdService.findAll();
  }

  @Get('providers/ads/:id')
  @ApiOperation({
    summary: 'Get provider ad by ID or list by provider ID',
    description:
      'ID가 광고 UUID이면 해당 광고 1건 반환. 해당 광고가 없으면 ID를 provider ID로 해석해 해당 프로바이더의 광고 목록을 반환.',
  })
  @ApiParam({ name: 'id', description: 'Provider ad UUID or provider (user) UUID' })
  @ApiResponse({ status: 200, description: 'Single ad or list of ads', type: ProviderAdResponseDto })
  @ApiResponse({ status: 404, description: 'Provider ad not found' })
  async getProviderAdById(@Param('id') id: string) {
    return this.providerAdService.findOneOrListByProviderId(id);
  }

  @Post('providers/ads')
  @ApiOperation({
    summary: 'Create provider ad',
    description: 'Create a new service provider promotion ad.',
  })
  @ApiBody({ type: CreateProviderAdDto })
  @ApiResponse({ status: 201, description: 'Provider ad created successfully', type: ProviderAdResponseDto })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async createProviderAd(@Body() createProviderAdDto: CreateProviderAdDto) {
    return this.providerAdService.create(createProviderAdDto);
  }

  @Patch('providers/ads/:id')
  @ApiOperation({
    summary: 'Update provider ad',
    description: 'Update an existing ad.',
  })
  @ApiParam({ name: 'id', description: 'Provider ad UUID' })
  @ApiBody({ type: UpdateProviderAdDto })
  @ApiResponse({ status: 200, description: 'Provider ad updated successfully', type: ProviderAdResponseDto })
  @ApiResponse({ status: 404, description: 'Provider ad or provider not found' })
  async updateProviderAd(@Param('id') id: string, @Body() updateProviderAdDto: UpdateProviderAdDto) {
    return this.providerAdService.update(id, updateProviderAdDto);
  }

  @Delete('providers/ads/:id')
  @ApiOperation({
    summary: 'Delete provider ad',
    description: 'Delete an ad.',
  })
  @ApiParam({ name: 'id', description: 'Provider ad UUID' })
  @ApiResponse({
    status: 200,
    description: 'Provider ad deleted successfully',
    schema: { type: 'object', properties: { deleted: { type: 'boolean', example: true }, id: { type: 'string', example: 'uuid' } }, required: ['deleted', 'id'] },
  })
  @ApiResponse({ status: 404, description: 'Provider ad not found' })
  async deleteProviderAd(@Param('id') id: string) {
    return this.providerAdService.remove(id);
  }

  @Get('providers')
  @ApiOperation({
    summary: 'Get service providers list',
    description: 'Get service providers list. Supports filtering, sorting, and pagination.',
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

  @Get('providers_profile/:id')
  @ApiOperation({
    summary: 'Get provider table data by provider id',
    description:
      'Get provider table data by provider ID (Provider table, not User Profile).',
  })
  @ApiResponse({
    status: 200,
    description: 'Provider table data retrieved successfully',
    type: Provider,
  })
  async getProviderTableProfile(@Param('id') providerId: string) {
    return this.usersService.findOneProvider(providerId);
  }

  @Get('bank-accounts')
  @ApiOperation({ summary: 'Get my bank accounts' })
  @ApiResponse({ status: 200, description: 'Bank accounts list' })
  async getBankAccounts(@GetUser() user: any) {
    return this.usersService.getBankAccounts(user.id);
  }

  @Post('bank-accounts')
  @ApiOperation({ summary: 'Register bank account' })
  @ApiBody({ type: CreateBankAccountDto })
  @ApiResponse({ status: 201, description: 'Bank account created' })
  async createBankAccount(@GetUser() user: any, @Body() dto: CreateBankAccountDto) {
    return this.usersService.createBankAccount(user.id, dto);
  }

  @Get('bank-accounts/:accountId')
  @ApiOperation({ summary: 'Get one bank account' })
  @ApiParam({ name: 'accountId', description: 'Bank account UUID' })
  @ApiResponse({ status: 200, description: 'Bank account' })
  async getBankAccount(@GetUser() user: any, @Param('accountId') accountId: string) {
    return this.usersService.getBankAccount(user.id, accountId);
  }

  @Delete('bank-accounts/:accountId')
  @ApiOperation({ summary: 'Delete bank account' })
  @ApiParam({ name: 'accountId', description: 'Bank account UUID' })
  @ApiResponse({ status: 200, description: 'Bank account deleted' })
  async deleteBankAccount(@GetUser() user: any, @Param('accountId') accountId: string) {
    await this.usersService.deleteBankAccount(user.id, accountId);
    return { message: 'Bank account deleted' };
  }

  @Get(':id/profile')
  @ApiOperation({ summary: 'Get user profile by ID (alias for GET /users/:id)' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully', type: User })
  async getProfileById(@Param('id') userId: string) {
    return this.usersService.findOne(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully', type: User })
  async getPublicProfile(@Param('id') userId: string) {
    return this.usersService.findOne(userId);
  }
}