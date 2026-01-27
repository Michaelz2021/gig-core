import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { ProviderFavorite } from './entities/provider-favorite.entity';
import { Provider } from './entities/provider.entity';
import { UserProfile } from './entities/user-profile.entity';
import { UserBankAccount } from './entities/user-bank-account.entity';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { IdVerificationDto } from './dto/id-verification.dto';
import { CertificateVerificationDto } from './dto/certificate-verification.dto';
import { PortfolioSubmissionDto } from './dto/portfolio-submission.dto';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ProviderFavorite)
    private readonly providerFavoriteRepository: Repository<ProviderFavorite>,
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(UserBankAccount)
    private readonly userBankAccountRepository: Repository<UserBankAccount>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(page: number = 1, limit: number = 20) {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { users, total };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: [
        'id', 'email', 'phone', 'password', 'firstName', 'lastName',
        'userType', 'profileImage', 'dateOfBirth', 'gender',
        'kycLevel', 'isEmailVerified', 'isPhoneVerified', 'isIdVerified',
        'twoFactorEnabled', 'status', 'lastLoginAt', 'deviceTokens',
        'serviceCategoryIds', 'createdAt', 'updatedAt', 'deletedAt'
      ]
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phone } });
  }

  async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) LIKE :searchTerm', { searchTerm })
      .orWhere('LOWER(user.firstName) LIKE :searchTerm', { searchTerm })
      .orWhere('LOWER(user.lastName) LIKE :searchTerm', { searchTerm })
      .orWhere('LOWER(CONCAT(user.firstName, \' \', user.lastName)) LIKE :searchTerm', { searchTerm })
      .orWhere('user.phone LIKE :searchTerm', { searchTerm })
      .andWhere('user.status = :status', { status: 'active' })
      .select([
        'user.id',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.phone',
        'user.profileImage',
        'user.userType',
      ])
      .take(limit)
      .getMany();
  }

  async create(userData: any): Promise<User> {
    const existingEmail = await this.findByEmail(userData.email);
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }
    const existingPhone = await this.findByPhone(userData.phone);
    if (existingPhone) {
      throw new ConflictException('Phone number already exists');
    }
    // Extract fields that don't belong to User entity (these go to UserProfile)
    const { bio, address, city, province, zipCode, trustScore, kycStatus, kycDocuments, deviceTokens, walletBalance, totalBookings, completedBookings, averageRating, totalReviews, isActive, ...userDataToSave } = userData;
    const user = this.userRepository.create(userDataToSave);
    const savedUser = await this.userRepository.save(user);
    return Array.isArray(savedUser) ? savedUser[0] : savedUser;
  }

  async update(id: string, userData: any): Promise<User> {
    const user = await this.findOne(id);
    const { phone, bio, address, city, province, zipCode, dateOfBirth, serviceCategoryIds, ...userTableData } = userData;
    
    // serviceCategoryIds validation
    let validatedServiceCategoryIds = undefined;
    if (serviceCategoryIds !== undefined) {
      if (Array.isArray(serviceCategoryIds)) {
        const uniqueIds = [...new Set(serviceCategoryIds)];
        if (uniqueIds.length > 3) {
          throw new BadRequestException('최대 3개의 서비스 카테고리만 선택할 수 있습니다.');
        }
        if (uniqueIds.length > 0) {
          const placeholders = uniqueIds.map((_, index) => `$${index + 1}`).join(', ');
          const validCategories = await this.dataSource.query(
            `SELECT id FROM service_categories WHERE id IN (${placeholders}) AND is_active = true`,
            uniqueIds
          );
          const validCategoryIds = validCategories.map((cat: any) => cat.id);
          const invalidIds = uniqueIds.filter(id => !validCategoryIds.includes(id));
          if (invalidIds.length > 0) {
            throw new BadRequestException(`다음 서비스 카테고리가 존재하지 않거나 비활성화되어 있습니다: ${invalidIds.join(', ')}`);
          }
          validatedServiceCategoryIds = uniqueIds;
        } else {
          validatedServiceCategoryIds = [];
        }
      } else {
        throw new BadRequestException('serviceCategoryIds는 배열 형식이어야 합니다.');
      }
    }

    // Update users table
    if (Object.keys(userTableData).length > 0 || dateOfBirth !== undefined || validatedServiceCategoryIds !== undefined) {
      const updateData: any = { ...userTableData };
      if (dateOfBirth !== undefined) {
        updateData.dateOfBirth = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
      }
      if (validatedServiceCategoryIds !== undefined) {
        updateData.serviceCategoryIds = validatedServiceCategoryIds;
      }
      Object.assign(user, updateData);
      await this.userRepository.save(user);
    }

    // Update user_profiles table
    if (bio !== undefined || address !== undefined || city !== undefined || province !== undefined || zipCode !== undefined) {
      let profile = await this.userProfileRepository
        .createQueryBuilder('profile')
        .where('profile.userId = :userId', { userId: id })
        .getOne();

      const profileUpdateData: any = {};
      if (bio !== undefined) profileUpdateData.bio = bio;
      if (address !== undefined) profileUpdateData.addressLine1 = address;
      if (city !== undefined) profileUpdateData.city = city;
      if (province !== undefined) profileUpdateData.province = province;
      if (zipCode !== undefined) profileUpdateData.postalCode = zipCode;

      if (profile) {
        Object.assign(profile, profileUpdateData);
        await this.userProfileRepository.save(profile);
      } else {
        const newProfile = this.userProfileRepository.create({
          userId: id,
          ...profileUpdateData,
        });
        await this.userProfileRepository.save(newProfile);
      }
    }

    return this.findOne(id);
  }

  async registerDeviceToken(userId: string, deviceToken: string): Promise<User> {
    const user = await this.findOne(userId);
    if (!user.deviceTokens) {
      user.deviceTokens = [];
    }
    if (!user.deviceTokens.includes(deviceToken)) {
      user.deviceTokens.push(deviceToken);
      await this.userRepository.save(user);
    }
    return user;
  }

  async removeDeviceToken(userId: string, deviceToken: string): Promise<User> {
    const user = await this.findOne(userId);
    if (user.deviceTokens && user.deviceTokens.length > 0) {
      user.deviceTokens = user.deviceTokens.filter(token => token !== deviceToken);
      await this.userRepository.save(user);
    }
    return user;
  }

  async getDeviceTokens(userId: string): Promise<string[]> {
    const user = await this.findOne(userId);
    return user.deviceTokens || [];
  }

  async updateTrustScore(id: string, score: number): Promise<User> {
    const user = await this.findOne(id);
    (user as any).trustScore = score;
    return this.userRepository.save(user);
  }

  async updateWalletBalance(id: string, amount: number): Promise<User> {
    const user = await this.findOne(id);
    (user as any).walletBalance = Number((user as any).walletBalance || 0) + amount;
    return this.userRepository.save(user);
  }

  async delete(id: string): Promise<void> {
    const user = await this.findOne(id);
    (user as any).isActive = false;
    await this.userRepository.save(user);
  }

  async addFavorite(userId: string, providerId: string, notes?: string): Promise<ProviderFavorite> {
    const provider = await this.providerRepository.findOne({ where: { id: providerId } });
    if (!provider) {
      throw new NotFoundException(`Provider with ID ${providerId} not found`);
    }
    const existing = await this.providerFavoriteRepository.findOne({
      where: { userId, providerId },
    });
    if (existing) {
      throw new ConflictException('Provider already in favorites');
    }
    const favorite = this.providerFavoriteRepository.create({
      userId,
      providerId,
      notes,
    });
    return this.providerFavoriteRepository.save(favorite);
  }

  async removeFavorite(userId: string, providerId: string): Promise<void> {
    const favorite = await this.providerFavoriteRepository.findOne({
      where: { userId, providerId },
    });
    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }
    await this.providerFavoriteRepository.remove(favorite);
  }

  async findAllFavorites(userId: string): Promise<{ items: ProviderFavorite[]; total: number }> {
    const [items, total] = await this.providerFavoriteRepository.findAndCount({
      where: { userId },
      relations: ['provider', 'provider.user'],
      order: { createdAt: 'DESC' },
    });
    return { items, total };
  }

  async findOneFavorite(userId: string, providerId: string): Promise<ProviderFavorite> {
    const favorite = await this.providerFavoriteRepository.findOne({
      where: { userId, providerId },
      relations: ['provider', 'provider.user'],
    });
    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }
    return favorite;
  }

  async findAllProviders(query: {
    category?: string;
    location?: string;
    minTrustScore?: number;
    maxPrice?: number;
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    providers: any[];
    pagination: any;
  }> {
    const { category, location, minTrustScore, maxPrice, sortBy = 'trustScore', page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const allProviders = await this.providerRepository.find({ take: 1000 });
    const activeProviders = allProviders.filter(p => p.isActive === true);
    const userIds = activeProviders.map(p => p.userId).filter(Boolean);
    const allUsers = userIds.length > 0 ? await this.userRepository.find({ take: 10000 }) : [];
    const users = allUsers.filter(u => userIds.includes(u.id));
    const userMap = new Map(users.map(u => [u.id, u]));
    let filteredProviders = activeProviders
      .map(provider => {
        (provider as any).user = userMap.get(provider.userId) || null;
        return provider;
      })
      .filter((provider) => {
        const user = (provider as any).user;
        if (!user || user.status !== 'active') {
          return false;
        }
        if (minTrustScore !== undefined && ((user as any).trustScore || 0) < minTrustScore) {
          return false;
        }
        return true;
      });
    const totalCount = filteredProviders.length;
    filteredProviders = filteredProviders.slice(skip, skip + limit);
    if (location && filteredProviders.length > 0) {
      const userIds = filteredProviders.map(p => p.userId).filter(Boolean);
      if (userIds.length > 0) {
        const allProfiles = await this.userProfileRepository.find({ take: 10000 });
        const profiles = allProfiles.filter(p => userIds.includes(p.userId));
        const profileMap = new Map(profiles.map(p => [p.userId, p]));
        const locationLower = location.toLowerCase();
        filteredProviders = filteredProviders.filter((provider) => {
          const profile = profileMap.get(provider.userId);
          if (!profile) return false;
          const cityMatch = profile.city?.toLowerCase().includes(locationLower);
          const provinceMatch = profile.province?.toLowerCase().includes(locationLower);
          return cityMatch || provinceMatch;
        });
      }
    }
    if (sortBy === 'newest' || sortBy === 'createdAt') {
      filteredProviders.sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate;
      });
    } else if (sortBy === 'trustScore') {
      filteredProviders.sort((a, b) => {
        const aScore = ((a as any).user?.trustScore || 0);
        const bScore = ((b as any).user?.trustScore || 0);
        return bScore - aScore;
      });
    } else if (sortBy === 'rating') {
      filteredProviders.sort((a, b) => {
        const aScore = ((a as any).user?.averageRating || 0);
        const bScore = ((b as any).user?.averageRating || 0);
        return bScore - aScore;
      });
    }
    const providersWithStats = filteredProviders.map((provider) => {
      const user = (provider as any).user;
      return {
        providerId: provider.id,
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        title: provider.businessName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        profileImage: user?.profileImage || null,
        trustScore: user?.trustScore || 0,
        rating: (user as any)?.averageRating || 0,
        reviewCount: (user as any)?.totalReviews || 0,
        jobsCompleted: provider.totalJobsCompleted,
        responseRate: provider.completionRate || 0,
        avgResponseTime: provider.responseTimeMinutes
          ? `${Math.floor(provider.responseTimeMinutes / 60)}h`
          : 'N/A',
        skills: provider.certifications?.map((c: any) => c.name || c) || [],
        hourlyRate: 0,
        location: location || 'Philippines',
        isOnline: false,
        lastActive: user?.lastLoginAt || user?.updatedAt || provider.updatedAt,
      };
    });
    return {
      providers: providersWithStats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(filteredProviders.length / limit),
        totalItems: filteredProviders.length,
        hasNext: page < Math.ceil(filteredProviders.length / limit),
        hasPrev: page > 1,
      },
    };
  }

  async findOneProvider(providerId: string): Promise<any> {
    let providerResult = await this.providerRepository.query(`
      SELECT 
        p.id,
        p.user_id as "userId",
        p.business_name as "businessName",
        p.business_type as "businessType",
        p.years_of_experience as "yearsOfExperience",
        p.certifications,
        p.portfolio_photos as "portfolioPhotos",
        p.instant_booking_enabled as "instantBookingEnabled",
        p.service_radius_km as "serviceRadiusKm",
        p.response_time_minutes as "responseTimeMinutes",
        p.completion_rate as "completionRate",
        p.total_jobs_completed as "totalJobsCompleted",
        p.is_active as "isActive",
        p.is_featured as "isFeatured",
        p.created_at as "createdAt",
        p.updated_at as "updatedAt",
        u.id as "user_id",
        u.email as "user_email",
        u.first_name as "user_firstName",
        u.last_name as "user_lastName",
        u.phone as "user_phone",
        u.profile_photo_url as "user_profileImage",
        u.date_of_birth as "user_dateOfBirth",
        u.gender as "user_gender",
        u.status as "user_status",
        u.is_email_verified as "user_isEmailVerified",
        u.is_phone_verified as "user_isPhoneVerified",
        u.kyc_level as "user_kycLevel",
        u.last_login_at as "user_lastLoginAt",
        u.created_at as "user_createdAt",
        u.updated_at as "user_updatedAt",
        u.service_category_ids as "user_serviceCategoryIds",
        COALESCE(ts.current_score, 0) as "user_trustScore",
        up.id as "profile_id",
        up.bio as "user_bio",
        up.address_line1 as "profile_addressLine1",
        up.address_line2 as "profile_addressLine2",
        up.city as "profile_city",
        up.province as "profile_province",
        up.postal_code as "profile_postalCode",
        up.country as "profile_country",
        up.latitude as "profile_latitude",
        up.longitude as "profile_longitude",
        up.preferred_language as "profile_preferredLanguage",
        up.preferred_currency as "profile_preferredCurrency",
        up.notification_email as "profile_notificationEmail",
        up.notification_sms as "profile_notificationSms",
        up.notification_push as "profile_notificationPush",
        up.created_at as "profile_createdAt",
        up.updated_at as "profile_updatedAt"
      FROM providers p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN trust_scores ts ON u.id = ts.user_id
      WHERE p.id = $1
    `, [providerId]);
    
    if (!providerResult || providerResult.length === 0) {
      providerResult = await this.providerRepository.query(`
        SELECT 
          p.id,
          p.user_id as "userId",
          p.business_name as "businessName",
          p.business_type as "businessType",
          p.years_of_experience as "yearsOfExperience",
          p.certifications,
          p.portfolio_photos as "portfolioPhotos",
          p.instant_booking_enabled as "instantBookingEnabled",
          p.service_radius_km as "serviceRadiusKm",
          p.response_time_minutes as "responseTimeMinutes",
          p.completion_rate as "completionRate",
          p.total_jobs_completed as "totalJobsCompleted",
          p.is_active as "isActive",
          p.is_featured as "isFeatured",
          p.created_at as "createdAt",
          p.updated_at as "updatedAt",
          u.id as "user_id",
          u.email as "user_email",
          u.first_name as "user_firstName",
          u.last_name as "user_lastName",
          u.phone as "user_phone",
          u.profile_photo_url as "user_profileImage",
          u.date_of_birth as "user_dateOfBirth",
          u.gender as "user_gender",
          u.status as "user_status",
          u.is_email_verified as "user_isEmailVerified",
          u.is_phone_verified as "user_isPhoneVerified",
          u.kyc_level as "user_kycLevel",
          u.last_login_at as "user_lastLoginAt",
          u.created_at as "user_createdAt",
          u.updated_at as "user_updatedAt",
          COALESCE(ts.current_score, 0) as "user_trustScore",
          up.id as "profile_id",
          up.bio as "user_bio",
          up.address_line1 as "profile_addressLine1",
          up.address_line2 as "profile_addressLine2",
          up.city as "profile_city",
          up.province as "profile_province",
          up.postal_code as "profile_postalCode",
          up.country as "profile_country",
          up.latitude as "profile_latitude",
          up.longitude as "profile_longitude",
          up.preferred_language as "profile_preferredLanguage",
          up.preferred_currency as "profile_preferredCurrency",
          up.notification_email as "profile_notificationEmail",
          up.notification_sms as "profile_notificationSms",
          up.notification_push as "profile_notificationPush",
          up.created_at as "profile_createdAt",
          up.updated_at as "profile_updatedAt"
        FROM providers p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN user_profiles up ON u.id = up.user_id
        LEFT JOIN trust_scores ts ON u.id = ts.user_id
        WHERE p.user_id = $1
      `, [providerId]);
    }
    
    if (!providerResult || providerResult.length === 0) {
      throw new NotFoundException(`Provider with ID ${providerId} not found`);
    }
    
    const provider = providerResult[0];
    const reviews = await this.providerFavoriteRepository.manager.query(`
      SELECT 
        r.id,
        r.reviewer_id as "reviewerId",
        r.reviewee_id as "revieweeId",
        r.rating,
        r.review_text as "reviewText",
        r.created_at as "createdAt",
        u_reviewer.id as "reviewer_id",
        u_reviewer.first_name as "reviewer_firstName",
        u_reviewer.last_name as "reviewer_lastName"
      FROM reviews r
      LEFT JOIN users u_reviewer ON r.reviewer_id = u_reviewer.id
      WHERE r.reviewee_id = $1
      ORDER BY r.created_at DESC
      LIMIT 10
    `, [provider.userId]);
    
    const ratingResult = await this.providerFavoriteRepository.manager.query(`
      SELECT 
        COUNT(*) as "reviewCount",
        COALESCE(AVG(r.rating), 0)::DECIMAL(3,2) as "avgRating"
      FROM reviews r
      WHERE r.reviewee_id = $1
    `, [provider.userId]);
    const reviewStats = ratingResult[0] || { reviewCount: 0, avgRating: 0 };
    
    const hourlyRateResult = await this.providerFavoriteRepository.manager.query(`
      SELECT 
        COALESCE(AVG(s.base_rate), 0)::DECIMAL(10,2) as "avgHourlyRate"
      FROM services s
      WHERE s.provider_id = $1
        AND s.rate_type = 'per_hour'
        AND s.is_active = true
    `, [provider.id]);
    const avgHourlyRate = hourlyRateResult[0]?.avgHourlyRate || 0;
    
    let portfolioPhotosArray: any[] = [];
    if (provider.portfolioPhotos) {
      try {
        if (Array.isArray(provider.portfolioPhotos)) {
          portfolioPhotosArray = provider.portfolioPhotos;
        } else if (typeof provider.portfolioPhotos === 'string') {
          portfolioPhotosArray = JSON.parse(provider.portfolioPhotos);
        } else if (typeof provider.portfolioPhotos === 'object') {
          portfolioPhotosArray = [provider.portfolioPhotos];
        }
      } catch (error) {
        console.error('Error parsing portfolio_photos:', error);
        portfolioPhotosArray = [];
      }
    }
    
    let certificationsArray: any[] = [];
    if (provider.certifications) {
      try {
        if (Array.isArray(provider.certifications)) {
          certificationsArray = provider.certifications;
        } else if (typeof provider.certifications === 'string') {
          certificationsArray = JSON.parse(provider.certifications);
        } else if (typeof provider.certifications === 'object') {
          certificationsArray = [provider.certifications];
        }
      } catch (error) {
        console.error('Error parsing certifications:', error);
        certificationsArray = [];
      }
    }
    
    return {
      providerId: provider.id,
      userId: provider.userId,
      businessName: provider.businessName,
      businessType: provider.businessType,
      yearsOfExperience: provider.yearsOfExperience || 0,
      certifications: certificationsArray,
      instantBookingEnabled: provider.instantBookingEnabled || false,
      serviceRadiusKm: provider.serviceRadiusKm || 10,
      responseTimeMinutes: provider.responseTimeMinutes,
      completionRate: provider.completionRate ? parseFloat(String(provider.completionRate)) : 0,
      totalJobsCompleted: provider.totalJobsCompleted ? parseInt(String(provider.totalJobsCompleted)) : 0,
      isActive: provider.isActive,
      isFeatured: provider.isFeatured || false,
      providerCreatedAt: provider.createdAt,
      providerUpdatedAt: provider.updatedAt,
      firstName: provider.user_firstName,
      lastName: provider.user_lastName,
      email: provider.user_email,
      phone: provider.user_phone,
      profileImage: provider.user_profileImage,
      dateOfBirth: provider.user_dateOfBirth,
      gender: provider.user_gender,
      status: provider.user_status,
      isEmailVerified: provider.user_isEmailVerified || false,
      isPhoneVerified: provider.user_isPhoneVerified || false,
      kycLevel: provider.user_kycLevel,
      lastLoginAt: provider.user_lastLoginAt,
      userCreatedAt: provider.user_createdAt,
      userUpdatedAt: provider.user_updatedAt,
      trustScore: provider.user_trustScore ? parseInt(String(provider.user_trustScore)) : 0,
      serviceCategoryIds: provider.user_serviceCategoryIds || [],
      bio: provider.user_bio || '',
      address: {
        line1: provider.profile_addressLine1,
        line2: provider.profile_addressLine2,
        city: provider.profile_city,
        province: provider.profile_province,
        postalCode: provider.profile_postalCode,
        country: provider.profile_country || 'PH',
      },
      location: {
        latitude: provider.profile_latitude ? parseFloat(String(provider.profile_latitude)) : null,
        longitude: provider.profile_longitude ? parseFloat(String(provider.profile_longitude)) : null,
      },
      preferredLanguage: provider.profile_preferredLanguage || 'en',
      preferredCurrency: provider.profile_preferredCurrency || 'PHP',
      notificationPreferences: {
        email: provider.profile_notificationEmail !== false,
        sms: provider.profile_notificationSms !== false,
        push: provider.profile_notificationPush !== false,
      },
      profileCreatedAt: provider.profile_createdAt,
      profileUpdatedAt: provider.profile_updatedAt,
      title: provider.businessName || `${provider.user_firstName} ${provider.user_lastName}`,
      rating: reviewStats.avgRating ? parseFloat(String(reviewStats.avgRating)) : 0,
      reviewCount: reviewStats.reviewCount ? parseInt(String(reviewStats.reviewCount)) : 0,
      jobsCompleted: provider.totalJobsCompleted ? parseInt(String(provider.totalJobsCompleted)) : 0,
      responseRate: provider.completionRate ? parseFloat(String(provider.completionRate)) : 0,
      avgResponseTime: provider.responseTimeMinutes && provider.responseTimeMinutes > 0
        ? provider.responseTimeMinutes >= 60
          ? `${Math.floor(provider.responseTimeMinutes / 60)}h ${provider.responseTimeMinutes % 60}m`
          : `${provider.responseTimeMinutes}m`
        : 'N/A',
      skills: certificationsArray.map((c: any) => c.name || c).filter(Boolean) || [],
      hourlyRate: avgHourlyRate ? parseFloat(String(avgHourlyRate)) : 0,
      locationString: provider.profile_city && provider.profile_province
        ? `${provider.profile_city}, ${provider.profile_province}`
        : provider.profile_country || 'Philippines',
      isOnline: false,
      lastActive: provider.user_lastLoginAt || provider.user_updatedAt,
      portfolio: portfolioPhotosArray,
      reviews: reviews.map((review: any) => ({
        reviewId: review.id,
        clientName: `${review.reviewer_firstName || ''} ${review.reviewer_lastName || ''}`.trim() || 'Anonymous',
        rating: review.rating,
        comment: review.reviewText || '',
        createdAt: review.createdAt,
      })),
    };
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const profile = await this.userProfileRepository
      .createQueryBuilder('profile')
      .where('profile.userId = :userId', { userId })
      .getOne();
    return profile;
  }

  async getProviderByUserId(userId: string): Promise<Provider | null> {
    const provider = await this.providerRepository
      .createQueryBuilder('provider')
      .where('provider.userId = :userId', { userId })
      .getOne();
    return provider;
  }

  async updateUserProfile(userId: string, updateData: UpdateUserProfileDto): Promise<UserProfile> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    let profile = await this.userProfileRepository
      .createQueryBuilder('profile')
      .where('profile.userId = :userId', { userId })
      .getOne();
    if (profile) {
      Object.assign(profile, updateData);
      return this.userProfileRepository.save(profile);
    } else {
      const newProfile = this.userProfileRepository.create({
        userId,
        ...updateData,
      });
      return this.userProfileRepository.save(newProfile);
    }
  }

  async submitIdVerification(userId: string, idVerificationDto: IdVerificationDto, idFrontBackImage: Express.Multer.File, selfieWithIdImage: Express.Multer.File): Promise<{ message: string }> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    if (!idFrontBackImage || !selfieWithIdImage) {
      throw new BadRequestException('Both ID image and selfie with ID image are required');
    }
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedMimeTypes.includes(idFrontBackImage.mimetype)) {
      throw new BadRequestException('ID image must be a valid image file (JPEG, PNG, or WebP)');
    }
    if (!allowedMimeTypes.includes(selfieWithIdImage.mimetype)) {
      throw new BadRequestException('Selfie with ID image must be a valid image file (JPEG, PNG, or WebP)');
    }
    const verificationDir = path.join(process.cwd(), 'uploads', 'id-verification', userId);
    if (!fs.existsSync(verificationDir)) {
      fs.mkdirSync(verificationDir, { recursive: true });
    }
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString('hex');
    const idFrontBackExtension = path.extname(idFrontBackImage.originalname);
    const selfieExtension = path.extname(selfieWithIdImage.originalname);
    const idFrontBackFileName = `id_front_back_${timestamp}_${randomId}${idFrontBackExtension}`;
    const selfieFileName = `selfie_with_id_${timestamp}_${randomId}${selfieExtension}`;
    const idFrontBackPath = path.join(verificationDir, idFrontBackFileName);
    const selfiePath = path.join(verificationDir, selfieFileName);
    fs.writeFileSync(idFrontBackPath, idFrontBackImage.buffer);
    fs.writeFileSync(selfiePath, selfieWithIdImage.buffer);
    await this.userRepository.update(userId, {
      isIdVerified: false,
    });
    return {
      message: 'verifying...',
    };
  }

  async submitCertificateVerification(userId: string, certificateVerificationDto: CertificateVerificationDto, certificateImage: Express.Multer.File): Promise<{ message: string }> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    if (!certificateImage) {
      throw new BadRequestException('Certificate image is required');
    }
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedMimeTypes.includes(certificateImage.mimetype)) {
      throw new BadRequestException('Certificate image must be a valid image file (JPEG, PNG, or WebP)');
    }
    const certificateDir = path.join(process.cwd(), 'uploads', 'certificate-verification', userId);
    if (!fs.existsSync(certificateDir)) {
      fs.mkdirSync(certificateDir, { recursive: true });
    }
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString('hex');
    const certificateExtension = path.extname(certificateImage.originalname);
    const certificateFileName = `certificate_${timestamp}_${randomId}${certificateExtension}`;
    const certificatePath = path.join(certificateDir, certificateFileName);
    fs.writeFileSync(certificatePath, certificateImage.buffer);
    return {
      message: 'verifying...',
    };
  }

  async submitPortfolio(userId: string, portfolioSubmissionDto: PortfolioSubmissionDto, images: Express.Multer.File[]): Promise<{ message: string }> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    if (!images || images.length === 0) {
      throw new BadRequestException('At least one portfolio image is required');
    }
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    for (const image of images) {
      if (!allowedMimeTypes.includes(image.mimetype)) {
        throw new BadRequestException('All portfolio images must be valid image files (JPEG, PNG, or WebP)');
      }
    }
    const portfolioDir = path.join(process.cwd(), 'uploads', 'portfolio', userId);
    if (!fs.existsSync(portfolioDir)) {
      fs.mkdirSync(portfolioDir, { recursive: true });
    }
    const timestamp = Date.now();
    const savedImages: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const randomId = crypto.randomBytes(8).toString('hex');
      const imageExtension = path.extname(images[i].originalname);
      const imageFileName = `portfolio_${timestamp}_${i + 1}_${randomId}${imageExtension}`;
      const imagePath = path.join(portfolioDir, imageFileName);
      fs.writeFileSync(imagePath, images[i].buffer);
      savedImages.push(`/uploads/portfolio/${userId}/${imageFileName}`);
    }
    return {
      message: 'verifying...',
    };
  }

  async createBankAccount(userId: string, createBankAccountDto: CreateBankAccountDto): Promise<UserBankAccount> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    const existingAccount = await this.userBankAccountRepository.findOne({
      where: {
        userId,
        accountNumber: createBankAccountDto.accountNumber,
        bankName: createBankAccountDto.bankName,
      },
    });
    if (existingAccount) {
      throw new ConflictException('This bank account is already registered');
    }
    const bankAccount = this.userBankAccountRepository.create({
      userId,
      bankName: createBankAccountDto.bankName,
      accountNumber: createBankAccountDto.accountNumber,
      accountName: createBankAccountDto.accountName,
      branch: createBankAccountDto.branch,
    });
    return await this.userBankAccountRepository.save(bankAccount);
  }

  async getBankAccounts(userId: string): Promise<UserBankAccount[]> {
    await this.findOne(userId);
    return await this.userBankAccountRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getBankAccount(userId: string, accountId: string): Promise<UserBankAccount> {
    const account = await this.userBankAccountRepository.findOne({
      where: { id: accountId, userId },
    });
    if (!account) {
      throw new NotFoundException(`Bank account with ID ${accountId} not found`);
    }
    return account;
  }

  async deleteBankAccount(userId: string, accountId: string): Promise<void> {
    const account = await this.getBankAccount(userId, accountId);
    await this.userBankAccountRepository.remove(account);
  }
}
