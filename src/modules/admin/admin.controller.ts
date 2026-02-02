import { Controller, Get, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { CreateServiceCategoryDto } from '../services/dto/create-service-category.dto';
import { NoticeType } from '../notices/entities/notice.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiOkResponse({ description: 'Dashboard statistics returned' })
  async getDashboard(@GetUser() user: any) {
    return this.adminService.getDashboardStats();
  }

  @Get('notices')
  @ApiOperation({ summary: 'Get notices list (admin)' })
  @ApiQuery({ name: 'type', required: false, enum: NoticeType, description: 'Filter by type (notice or news)' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiOkResponse({ description: 'Notices list returned' })
  async getNotices(
    @Query('type') type?: NoticeType,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    const items = await this.adminService.getNotices(type, isActiveBool);
    return { items, total: items.length };
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get all notifications (admin)' })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Notifications list returned' })
  async getNotifications(
    @Query('type') type?: NotificationType,
    @Query('isRead') isRead?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationsService.findAll(
      type,
      isRead,
      page ?? 1,
      limit ?? 20,
    );
  }

  @Get('projects/pending-bids')
  @ApiOperation({ summary: 'Get projects waiting for bids' })
  @ApiOkResponse({ description: 'Projects waiting for bids returned' })
  async getProjectsPendingBids() {
    return this.adminService.getProjectsPendingBids();
  }

  @Get('projects/contracted')
  @ApiOperation({ summary: 'Get contracted projects' })
  @ApiOkResponse({ description: 'Contracted projects returned' })
  async getContractedProjects() {
    return this.adminService.getContractedProjects();
  }

  @Get('projects/in-progress')
  @ApiOperation({ summary: 'Get projects in progress' })
  @ApiOkResponse({ description: 'Projects in progress returned' })
  async getProjectsInProgress() {
    return this.adminService.getProjectsInProgress();
  }

  @Get('projects/completed')
  @ApiOperation({ summary: 'Get completed projects' })
  @ApiOkResponse({ description: 'Completed projects returned' })
  async getCompletedProjects() {
    return this.adminService.getCompletedProjects();
  }

  @Get('bookings')
  @ApiOperation({ summary: 'Get all bookings' })
  @ApiOkResponse({ description: 'All bookings returned' })
  async getAllBookings() {
    return this.adminService.getAllBookings();
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get all providers table information' })
  @ApiOkResponse({ description: 'Providers list returned' })
  async getProviders() {
    return this.adminService.getProviders();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get users list' })
  @ApiQuery({ name: 'type', required: false, description: 'User type filter' })
  @ApiOkResponse({ description: 'Users list returned' })
  async getUsers(@Query('type') type?: string) {
    return this.adminService.getUsers(type);
  }

  @Get('escrows')
  @ApiOperation({ summary: 'Get all escrows' })
  @ApiOkResponse({ description: 'Escrows returned' })
  async getEscrows() {
    return this.adminService.getEscrows();
  }

  @Get('wallets')
  @ApiOperation({ summary: 'Get wallet users' })
  @ApiOkResponse({ description: 'Wallet users returned' })
  async getWalletUsers() {
    return this.adminService.getWalletUsers();
  }

  @Get('wallets/:userId/transactions')
  @ApiOperation({ summary: 'Get wallet user transactions' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOkResponse({ description: 'Wallet transactions returned' })
  async getWalletUserTransactions(@Param('userId') userId: string) {
    return this.adminService.getWalletUserTransactions(userId);
  }

  @Get('service-categories')
  @ApiOperation({ summary: 'Get service categories' })
  @ApiOkResponse({ description: 'Service categories returned' })
  async getServiceCategories() {
    return this.adminService.getServiceCategories();
  }

  @Get('service-categories/:categoryId/subcategories')
  @ApiOperation({ summary: 'Get subcategories by category' })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiOkResponse({ description: 'Subcategories returned' })
  async getSubCategoriesByCategory(@Param('categoryId') categoryId: string) {
    return this.adminService.getSubCategoriesByCategory(categoryId);
  }

  @Get('service-categories/:categoryId/services')
  @ApiOperation({ summary: 'Get services by category' })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiOkResponse({ description: 'Services returned' })
  async getServicesByCategory(@Param('categoryId') categoryId: string) {
    return this.adminService.getServicesByCategory(categoryId);
  }

  @Get('service-categories/:id')
  @ApiOperation({ summary: 'Get service category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiOkResponse({ description: 'Service category returned' })
  async getServiceCategoryById(@Param('id') id: string) {
    return this.adminService.getServiceCategoryById(id);
  }

  @Put('service-categories/:id')
  @ApiOperation({ summary: 'Update service category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiOkResponse({ description: 'Service category updated' })
  async updateServiceCategory(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateServiceCategoryDto & { categoryLevel?: number }>,
  ) {
    return this.adminService.updateServiceCategory(id, updateData);
  }

  @Get('test/pending-bids')
  @ApiOperation({ summary: 'Test: Get projects pending bids' })
  @ApiOkResponse({ description: 'Test data returned' })
  async testPendingBids() {
    return this.adminService.getProjectsPendingBids();
  }

  @Get('test/auction-bids/:auctionId')
  @ApiOperation({ summary: 'Test: Get auction bids' })
  @ApiParam({ name: 'auctionId', description: 'Auction ID' })
  @ApiOkResponse({ description: 'Test data returned' })
  async testAuctionBids(@Param('auctionId') auctionId: string) {
    return this.adminService.getAuctionBids(auctionId);
  }

  @Get('auctions/:auctionId/bids')
  @ApiOperation({ summary: 'Get auction bids' })
  @ApiParam({ name: 'auctionId', description: 'Auction ID' })
  @ApiOkResponse({ description: 'Auction bids returned' })
  async getAuctionBids(@Param('auctionId') auctionId: string) {
    return this.adminService.getAuctionBids(auctionId);
  }

  @Get('users/:userId/profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiOkResponse({ description: 'User profile returned' })
  async getUserProfile(@Param('userId') userId: string) {
    return this.adminService.getUserProfile(userId);
  }
}
