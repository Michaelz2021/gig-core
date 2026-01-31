import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Auction, AuctionStatus } from '../matching/entities/auction.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { User, UserType } from '../users/entities/user.entity';
import { Escrow } from '../payments/entities/escrow.entity';
import { Transaction } from '../payments/entities/transaction.entity';
import { Wallet } from '../payments/entities/wallet.entity';
import { WalletTransaction } from '../payments/entities/wallet-transaction.entity';
import { Service } from '../services/entities/service.entity';
import { ServiceCategory } from '../services/entities/service-category.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { AuctionBid } from '../matching/entities/auction-bid.entity';
import { Provider } from '../users/entities/provider.entity';
import { Portfolio } from '../users/entities/portfolio.entity';
import { CreateServiceCategoryDto } from '../services/dto/create-service-category.dto';
import { NoticesService } from '../notices/notices.service';
import { NoticeType } from '../notices/entities/notice.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Auction)
    private readonly auctionRepository: Repository<Auction>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Escrow)
    private readonly escrowRepository: Repository<Escrow>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly walletTransactionRepository: Repository<WalletTransaction>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(ServiceCategory)
    private readonly serviceCategoryRepository: Repository<ServiceCategory>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(AuctionBid)
    private readonly auctionBidRepository: Repository<AuctionBid>,
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
    private readonly noticesService: NoticesService,
  ) {}

  async getNotices(type?: NoticeType, isActive?: boolean) {
    return this.noticesService.findAll(type, isActive);
  }

  async getDashboardStats() {
    const [totalUsers, providers, consumers] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { userType: UserType.PROVIDER } }),
      this.userRepository.count({ where: { userType: UserType.CONSUMER } }),
    ]);

    const [awaitingBids, inProgress, completed, cancelled] = await Promise.all([
      this.auctionRepository.count({ where: { status: AuctionStatus.PUBLISHED } }),
      this.auctionRepository.count({ where: { status: AuctionStatus.BIDDING } }),
      this.auctionRepository.count({ where: { status: AuctionStatus.SELECTED } }),
      this.auctionRepository.count({ where: { status: AuctionStatus.CANCELLED } }),
    ]);

    // DB booking_status_enum: pending_payment, pending_acceptance, confirmed, in_progress, awaiting_confirmation, completed, cancelled, disputed (no 'pending')
    const [pending, confirmed, inProgressBookings, completedBookings, cancelledBookings] = await Promise.all([
      this.bookingRepository.count({ where: { status: In([BookingStatus.PENDING_PAYMENT, BookingStatus.PENDING_ACCEPTANCE]) } }),
      this.bookingRepository.count({ where: { status: BookingStatus.CONFIRMED } }),
      this.bookingRepository.count({ where: { status: BookingStatus.IN_PROGRESS } }),
      this.bookingRepository.count({ where: { status: BookingStatus.COMPLETED } }),
      this.bookingRepository.count({ where: { status: BookingStatus.CANCELLED } }),
    ]);

    return {
      users: {
        total: totalUsers,
        providers,
        consumers,
      },
      auctions: {
        awaitingBids,
        inProgress,
        completed,
        cancelled,
      },
      bookings: {
        pending,
        confirmed,
        inProgress: inProgressBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
      },
    };
  }

  async getProjectsPendingBids() {
    const auctions = await this.auctionRepository.find({
      where: { status: AuctionStatus.PUBLISHED },
      relations: ['consumer'],
      order: { createdAt: 'DESC' },
    });

    const items = auctions.map((auction) => ({
      id: auction.id,
      auctionNumber: auction.auctionNumber,
      title: auction.serviceTitle,
      description: auction.serviceDescription,
      location: auction.serviceLocation,
      budgetMin: auction.budgetMin,
      budgetMax: auction.budgetMax,
      aiFairPrice: auction.aiFairPrice,
      status: auction.status,
      totalBids: auction.totalBids,
      totalViews: auction.totalViews,
      deadline: auction.deadline,
      consumer: {
        id: auction.consumerId,
        email: auction.consumer?.email || '',
        name: auction.consumer
          ? `${auction.consumer.firstName} ${auction.consumer.lastName}`.trim()
          : '',
      },
      createdAt: auction.createdAt,
    }));

    return { items, total: items.length };
  }

  async getContractedProjects() {
    const bookings = await this.bookingRepository.find({
      where: { status: BookingStatus.CONFIRMED },
      relations: ['consumer', 'provider'],
      order: { createdAt: 'DESC' },
    });

    const items = bookings.map((booking) => ({
      id: booking.id,
      status: booking.status,
      serviceTitle: (booking as any).serviceTitle || (booking as any).service?.title || '',
      totalAmount: booking.totalAmount,
      consumer: {
        id: booking.consumerId,
        email: (booking.consumer as any)?.email || '',
        name: (booking.consumer as any)
          ? `${(booking.consumer as any).firstName} ${(booking.consumer as any).lastName}`.trim()
          : '',
      },
      provider: {
        id: booking.providerId,
        email: (booking.provider as any)?.email || '',
        name: (booking.provider as any)
          ? `${(booking.provider as any).firstName} ${(booking.provider as any).lastName}`.trim()
          : '',
      },
      createdAt: booking.createdAt,
    }));

    return { items, total: items.length };
  }

  async getProjectsInProgress() {
    const bookings = await this.bookingRepository.find({
      where: { status: BookingStatus.IN_PROGRESS },
      relations: ['consumer', 'provider'],
      order: { createdAt: 'DESC' },
    });

    const items = bookings.map((booking) => ({
      id: booking.id,
      status: booking.status,
      serviceTitle: (booking as any).serviceTitle || (booking as any).service?.title || '',
      totalAmount: booking.totalAmount,
      consumer: {
        id: booking.consumerId,
        email: (booking.consumer as any)?.email || '',
        name: (booking.consumer as any)
          ? `${(booking.consumer as any).firstName} ${(booking.consumer as any).lastName}`.trim()
          : '',
      },
      provider: {
        id: booking.providerId,
        email: (booking.provider as any)?.email || '',
        name: (booking.provider as any)
          ? `${(booking.provider as any).firstName} ${(booking.provider as any).lastName}`.trim()
          : '',
      },
      createdAt: booking.createdAt,
      startedAt: (booking as any).startedAt || booking.actualStartTime || null,
    }));

    return { items, total: items.length };
  }

  async getCompletedProjects() {
    const bookings = await this.bookingRepository.find({
      where: { status: BookingStatus.COMPLETED },
      relations: ['consumer', 'provider'],
      order: { createdAt: 'DESC' },
    });

    const items = bookings.map((booking) => ({
      id: booking.id,
      status: booking.status,
      serviceTitle: (booking as any).serviceTitle || (booking as any).service?.title || '',
      totalAmount: booking.totalAmount,
      consumer: {
        id: booking.consumerId,
        email: (booking.consumer as any)?.email || '',
        name: (booking.consumer as any)
          ? `${(booking.consumer as any).firstName} ${(booking.consumer as any).lastName}`.trim()
          : '',
      },
      provider: {
        id: booking.providerId,
        email: (booking.provider as any)?.email || '',
        name: (booking.provider as any)
          ? `${(booking.provider as any).firstName} ${(booking.provider as any).lastName}`.trim()
          : '',
      },
      createdAt: booking.createdAt,
      completedAt: (booking as any).completedAt || null,
    }));

    return { items, total: items.length };
  }

  async getAllBookings() {
    const [items, total] = await this.bookingRepository.findAndCount({
      order: { createdAt: 'DESC' },
    });
    return { items, total };
  }

  async getUsers(userType?: string) {
    const where: any = {};
    if (userType) {
      where.userType = userType;
    }
    const [users, total] = await this.userRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
    });

    const items = users.map((user) => ({
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      userType: user.userType,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    }));

    return { items, total };
  }

  async getProviders() {
    const [items, total] = await this.providerRepository.findAndCount({
      order: { createdAt: 'DESC' },
    });
    return { items, total };
  }

  async getEscrows() {
    const [items, total] = await this.escrowRepository.findAndCount({
      order: { createdAt: 'DESC' },
    });
    return { items, total };
  }

  async getWalletUsers() {
    return this.walletRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getWalletUserTransactions(userId: string) {
    const [items, total] = await this.walletTransactionRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return { items, total };
  }

  async getServiceCategories() {
    return this.serviceCategoryRepository.find({
      order: { displayOrder: 'ASC', name: 'ASC' },
    });
  }

  async getSubCategoriesByCategory(categoryId: string) {
    return this.serviceCategoryRepository.find({
      where: { parentCategoryId: categoryId },
      order: { displayOrder: 'ASC', name: 'ASC' },
    });
  }

  async getServicesByCategory(categoryId: string) {
    return this.serviceRepository.find({
      where: { categoryId: categoryId },
      order: { createdAt: 'DESC' },
    });
  }

  async getServiceCategoryById(id: string) {
    return this.serviceCategoryRepository.findOne({ where: { id } });
  }

  async updateServiceCategory(id: string, updateData: Partial<CreateServiceCategoryDto & { categoryLevel?: number }>) {
    const category = await this.getServiceCategoryById(id);
    if (!category) {
      throw new Error('Service category not found');
    }
    Object.assign(category, updateData);
    return this.serviceCategoryRepository.save(category);
  }

  async getUserProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }
    const profile = await this.userProfileRepository.findOne({ where: { userId } });
    const provider = await this.providerRepository.findOne({ where: { userId } });

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`.trim(),
        userType: user.userType,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        profileImage: user.profileImage,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      profile: profile
        ? {
            id: profile.id,
            userId: profile.userId,
            bio: profile.bio,
            addressLine1: profile.addressLine1,
            addressLine2: profile.addressLine2,
            city: profile.city,
            province: profile.province,
            postalCode: profile.postalCode,
            country: profile.country,
            latitude: profile.latitude || 0,
            longitude: profile.longitude || 0,
            preferredLanguage: profile.preferredLanguage,
            preferredCurrency: profile.preferredCurrency,
            notificationEmail: profile.notificationEmail,
            notificationSms: profile.notificationSms,
            notificationPush: profile.notificationPush,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          }
        : null,
      provider: provider || null,
    };
  }

  async getAuctionBids(auctionId: string) {
    const [items, total] = await this.auctionBidRepository.findAndCount({
      where: { auctionId },
      order: { createdAt: 'DESC' },
    });
    return { items, total };
  }
}
