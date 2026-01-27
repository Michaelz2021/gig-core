import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServicesService } from '../services/services.service';
import { UsersService } from '../users/users.service';
import { BookingsService } from '../bookings/bookings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { Auction, AuctionStatus } from './entities/auction.entity';
import { AuctionBid, AuctionBidStatus } from './entities/auction-bid.entity';
import { AIQuotationSession, QuotationSessionStatus } from './entities/ai-quotation-session.entity';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { CreateAuctionBidDto } from './dto/create-auction-bid.dto';
import { CreateQuotationSessionDto } from './dto/create-quotation-session.dto';
import { AddMessageToSessionDto } from './dto/add-message-to-session.dto';

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(Auction)
    private readonly auctionRepository: Repository<Auction>,
    @InjectRepository(AuctionBid)
    private readonly auctionBidRepository: Repository<AuctionBid>,
    @InjectRepository(AIQuotationSession)
    private readonly quotationSessionRepository: Repository<AIQuotationSession>,
    private readonly servicesService: ServicesService,
    private readonly usersService: UsersService,
    private readonly bookingsService: BookingsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getRecommendations(userId: string, category?: string, limit: number = 10) {
    const searchDto: any = { limit };
    if (category) {
      searchDto.category = category;
    }
    const { items } = await this.servicesService.findAll(searchDto);
    const recommendations = items
      .map((service: any) => ({
        ...service,
        score: this.calculateRecommendationScore(service),
      }))
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, limit);
    return { items: recommendations, total: recommendations.length };
  }

  private calculateRecommendationScore(service: any): number {
    const trustScore = service.provider?.trustScore || 0;
    const rating = service.averageRating || 0;
    const bookings = service.totalBookings || 0;
    return trustScore * 0.4 + rating * 0.4 + Math.min(bookings / 100, 1) * 0.2;
  }

  async createAuction(consumerId: string, createAuctionDto: CreateAuctionDto): Promise<Auction> {
    const auctionNumber = `AUCT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const auction = this.auctionRepository.create({
      ...createAuctionDto,
      consumerId,
      auctionNumber,
      status: AuctionStatus.DRAFT,
      preferredDate: createAuctionDto.preferredDate ? new Date(createAuctionDto.preferredDate) : null,
      deadline: createAuctionDto.deadline ? new Date(createAuctionDto.deadline) : null,
    });
    const savedAuction = await this.auctionRepository.save(auction);
    
    // Notify providers about new auction
    try {
      await this.notifyProvidersAboutNewAuction(savedAuction);
    } catch (error) {
      console.error('Failed to notify providers about new auction:', error);
    }
    
    return savedAuction;
  }

  private async notifyProvidersAboutNewAuction(auction: Auction) {
    try {
      // Get service category IDs from auction
      const serviceCategoryIds = auction.serviceCategoryId ? [auction.serviceCategoryId] : [];
      
      if (serviceCategoryIds.length === 0) {
        console.warn('No service category IDs found for auction, skipping provider notification');
        return;
      }

      // Find providers with matching service categories
      const providers = await this.usersService.findAllProviders({
        category: serviceCategoryIds[0],
        limit: 1000,
      });

      if (providers.providers.length === 0) {
        console.log(`No providers found for service category ${serviceCategoryIds[0]}`);
        return;
      }

      // Send notifications to all matching providers
      for (const provider of providers.providers) {
        try {
          await this.notificationsService.send(
            provider.providerId,
            NotificationType.AUCTION,
            'New Auction Available',
            `A new auction has been posted: ${auction.serviceTitle}`,
            {
              auctionId: auction.id,
              serviceTitle: auction.serviceTitle,
              serviceDescription: auction.serviceDescription,
              budgetMin: auction.budgetMin,
              budgetMax: auction.budgetMax,
              actionUrl: `/auctions/${auction.id}`,
              relatedEntityType: 'auction',
              relatedEntityId: auction.id,
            },
          );
        } catch (error) {
          console.error(`Failed to send notification to provider ${provider.providerId}:`, error);
        }
      }

      console.log(`Sent auction notifications to ${providers.providers.length} providers`);
    } catch (error) {
      console.error('Error notifying providers about new auction:', error);
      throw error;
    }
  }

  async findAllAuctions(userId?: string, status?: AuctionStatus) {
    console.log('[MatchingService] findAllAuctions - userId:', userId, 'status:', status);
    const queryBuilder = this.auctionRepository
      .createQueryBuilder('auction')
      .leftJoinAndSelect('auction.consumer', 'consumer');

    if (userId) {
      queryBuilder.where('auction.consumerId = :userId', { userId });
    }
    if (status) {
      const statusStr = typeof status === 'string' ? status : String(status);
      if (userId) {
        queryBuilder.andWhere('auction.status::text = :status', { status: statusStr });
      } else {
        queryBuilder.where('auction.status::text = :status', { status: statusStr });
      }
    }
    queryBuilder.orderBy('auction.createdAt', 'DESC');
    const [items, total] = await queryBuilder.getManyAndCount();
    console.log('[MatchingService] findAllAuctions - Found auctions:', total);
    if (items.length > 0) {
      console.log(
        '[MatchingService] findAllAuctions - Auction statuses:',
        items.map((a) => ({ number: a.auctionNumber, status: a.status })),
      );
    }
    return { items, total };
  }

  async searchAuctions(filters: {
    keyword?: string;
    category?: string;
    status?: AuctionStatus;
    location?: string;
    budgetMin?: number;
    budgetMax?: number;
    page?: number;
    limit?: number;
  }) {
    const queryBuilder = this.auctionRepository
      .createQueryBuilder('auction')
      .leftJoinAndSelect('auction.consumer', 'consumer');

    if (filters.keyword) {
      queryBuilder.andWhere('(auction.serviceTitle ILIKE :keyword OR auction.serviceDescription ILIKE :keyword)', {
        keyword: `%${filters.keyword}%`,
      });
    }
    if (filters.category) {
      queryBuilder.andWhere('auction.serviceCategoryId = :category', { category: filters.category });
    }
    if (filters.status) {
      if (filters.status === AuctionStatus.PUBLISHED) {
        queryBuilder.andWhere('(auction.status = :status OR auction.status = :biddingStatus)', {
          status: filters.status,
          biddingStatus: AuctionStatus.BIDDING,
        });
      } else {
        queryBuilder.andWhere('auction.status = :status', { status: filters.status });
      }
    }
    if (filters.location) {
      queryBuilder.andWhere('auction.serviceLocation ILIKE :location', { location: `%${filters.location}%` });
    }
    if (filters.budgetMin !== undefined) {
      queryBuilder.andWhere('(auction.budgetMax >= :budgetMin OR auction.budgetMin >= :budgetMin)', {
        budgetMin: filters.budgetMin,
      });
    }
    if (filters.budgetMax !== undefined) {
      queryBuilder.andWhere('(auction.budgetMin <= :budgetMax OR auction.budgetMax <= :budgetMax)', {
        budgetMax: filters.budgetMax,
      });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    queryBuilder.orderBy('auction.createdAt', 'DESC').skip(skip).take(limit);
    const [items, total] = await queryBuilder.getManyAndCount();

    let debugInfo: any = null;
    if (total === 0) {
      const categoryCount = filters.category
        ? await this.auctionRepository.count({ where: { serviceCategoryId: filters.category } })
        : null;
      const statusCount = filters.status
        ? await this.auctionRepository.count({ where: { status: filters.status } })
        : null;
      const locationCount = filters.location
        ? await this.auctionRepository
            .createQueryBuilder('auction')
            .where('auction.serviceLocation ILIKE :location', { location: `%${filters.location}%` })
            .getCount()
        : null;
      debugInfo = {
        message: 'No auctions found matching all criteria',
        filterBreakdown: {
          category: filters.category
            ? {
                id: filters.category,
                count: categoryCount,
                message: categoryCount === 0 ? 'No auctions found for this category' : null,
              }
            : null,
          status: filters.status
            ? {
                value: filters.status,
                count: statusCount,
                message: statusCount === 0 ? `No auctions found with status '${filters.status}'` : null,
              }
            : null,
          location: filters.location
            ? {
                value: filters.location,
                count: locationCount,
                message:
                  locationCount === 0 ? `No auctions found in location containing '${filters.location}'` : null,
              }
            : null,
        },
      };
    }

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      ...(debugInfo && { debug: debugInfo }),
    };
  }

  async findOneAuction(id: string): Promise<Auction> {
    const auction = await this.auctionRepository.findOne({
      where: { id },
      relations: ['consumer'],
    });
    if (!auction) {
      throw new NotFoundException(`Auction with ID ${id} not found`);
    }
    auction.totalViews += 1;
    await this.auctionRepository.save(auction);
    return auction;
  }

  async publishAuction(id: string): Promise<Auction> {
    const auction = await this.findOneAuction(id);
    auction.status = AuctionStatus.PUBLISHED;
    return this.auctionRepository.save(auction);
  }

  async selectBid(auctionId: string, bidId: string, reason?: string) {
    const auction = await this.findOneAuction(auctionId);
    const bid = await this.auctionBidRepository.findOne({ where: { id: bidId } });
    if (!bid || bid.auctionId !== auctionId) {
      throw new NotFoundException('Bid not found');
    }
    if (auction.selectedBidId) {
      throw new BadRequestException('Auction already has a selected bid');
    }
    auction.selectedBidId = bidId;
    auction.selectionReason = reason;
    auction.selectedAt = new Date();
    auction.status = AuctionStatus.SELECTED;
    bid.status = AuctionBidStatus.SELECTED;
    bid.selectedAt = new Date();
    await this.auctionBidRepository.save(bid);
    const savedAuction = await this.auctionRepository.save(auction);
    let booking;
    try {
      booking = await this.bookingsService.createFromAuction(auctionId, bidId);
    } catch (error: any) {
      auction.selectedBidId = null;
      auction.selectionReason = null;
      auction.selectedAt = null;
      auction.status = AuctionStatus.REVIEWING;
      bid.status = AuctionBidStatus.UNDER_REVIEW;
      bid.selectedAt = null;
      await this.auctionRepository.save(auction);
      await this.auctionBidRepository.save(bid);
      throw new BadRequestException(`Failed to create booking: ${error.message}`);
    }
    return {
      auction: savedAuction,
      booking,
    };
  }

  async createBid(userId: string, createBidDto: CreateAuctionBidDto): Promise<AuctionBid> {
    const provider = await this.usersService.getProviderByUserId(userId);
    if (!provider) {
      throw new BadRequestException('Provider profile not found. Please complete your provider profile first.');
    }
    const providerId = provider.id;
    const auction = await this.findOneAuction(createBidDto.auctionId);
    if (auction.status !== AuctionStatus.PUBLISHED && auction.status !== AuctionStatus.BIDDING) {
      throw new BadRequestException('Auction is not accepting bids');
    }
    const existingBid = await this.auctionBidRepository.findOne({
      where: { auctionId: createBidDto.auctionId, providerId },
    });
    if (existingBid) {
      throw new BadRequestException('You have already submitted a bid for this auction');
    }
    const bid = this.auctionBidRepository.create({
      ...createBidDto,
      providerId,
      status: AuctionBidStatus.SUBMITTED,
      submittedAt: new Date(),
      proposedStartDate: createBidDto.proposedStartDate ? new Date(createBidDto.proposedStartDate) : null,
      proposedCompletionDate: createBidDto.proposedCompletionDate
        ? new Date(createBidDto.proposedCompletionDate)
        : null,
    });
    const savedBid = await this.auctionBidRepository.save(bid);
    auction.totalBids += 1;
    if (auction.status === AuctionStatus.PUBLISHED) {
      auction.status = AuctionStatus.BIDDING;
    }
    await this.auctionRepository.save(auction);
    try {
      await this.notifyConsumerAboutNewBid(auction.consumerId, auction, savedBid, provider);
    } catch (error) {
      console.error('Failed to send bid notification to consumer:', error);
    }
    const bidWithStatus = await this.auctionBidRepository.findOne({
      where: { id: savedBid.id },
    });
    return bidWithStatus || savedBid;
  }

  private async notifyConsumerAboutNewBid(consumerId: string, auction: Auction, bid: AuctionBid, provider: any) {
    try {
      const consumer = await this.usersService.findOne(consumerId);
      if (!consumer) {
        console.warn(`Consumer with ID ${consumerId} not found`);
        return;
      }
      const providerUser = await this.usersService.findOne(provider.userId);
      const providerName = providerUser
        ? `${providerUser.firstName} ${providerUser.lastName}`.trim()
        : 'A provider';
      const message = `${providerName} has submitted a bid for your auction: ${auction.serviceTitle}`;
      await this.notificationsService.send(consumerId, NotificationType.AUCTION, 'New Bid Received', message, {
        auctionId: auction.id,
        bidId: bid.id,
        providerId: provider.id,
        providerUserId: provider.userId,
        serviceTitle: auction.serviceTitle,
        proposedPrice: bid.proposedPrice,
        estimatedDuration: bid.estimatedDuration,
        actionUrl: `/auctions/${auction.id}/bids`,
        relatedEntityType: 'auction_bid',
        relatedEntityId: bid.id,
      });
      console.log(`Bid notification sent to consumer ${consumerId} for auction ${auction.id}`);
    } catch (error) {
      console.error('Error sending bid notification to consumer:', error);
      throw error;
    }
  }

  async findAllBids(auctionId: string) {
    const [items, total] = await this.auctionBidRepository.findAndCount({
      where: { auctionId },
      relations: ['provider', 'auction'],
      order: { createdAt: 'DESC' },
    });
    return { items, total };
  }

  async findBids(providerId?: string, status?: string, page: number = 1, limit: number = 20) {
    const queryBuilder = this.auctionBidRepository
      .createQueryBuilder('bid')
      .leftJoinAndSelect('bid.provider', 'provider')
      .leftJoinAndSelect('bid.auction', 'auction')
      .orderBy('bid.createdAt', 'DESC');

    if (providerId) {
      queryBuilder.andWhere('(bid.providerId = :providerId OR provider.userId = :providerId)', { providerId });
    }
    if (status) {
      const statusArray = status.split(',').map((s) => s.trim()).filter((s) => s);
      if (statusArray.length > 0) {
        const statusMap: Record<string, string> = {
          pending: 'submitted',
          declined: 'rejected',
        };
        const mappedStatuses = statusArray.map((s) => statusMap[s.toLowerCase()] || s.toLowerCase());
        queryBuilder.andWhere('bid.status IN (:...statuses)', { statuses: mappedStatuses });
      }
    }
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);
    const [items, total] = await queryBuilder.getManyAndCount();
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneBid(id: string): Promise<AuctionBid> {
    const bid = await this.auctionBidRepository.findOne({
      where: { id },
      relations: ['provider', 'auction'],
    });
    if (!bid) {
      throw new NotFoundException(`Bid with ID ${id} not found`);
    }
    return bid;
  }

  async updateBidStatus(bidId: string, status: AuctionBidStatus, reason?: string): Promise<AuctionBid> {
    const bid = await this.auctionBidRepository.findOne({
      where: { id: bidId },
      relations: ['auction'],
    });
    if (!bid) {
      throw new NotFoundException(`Bid with ID ${bidId} not found`);
    }
    const allowedStatuses = [AuctionBidStatus.UNDER_REVIEW, AuctionBidStatus.SHORTLISTED, AuctionBidStatus.REJECTED];
    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException(`Status ${status} is not allowed. Allowed statuses: ${allowedStatuses.join(', ')}`);
    }
    if (bid.status === AuctionBidStatus.SELECTED) {
      throw new BadRequestException('Cannot change status of a selected bid');
    }
    bid.status = status;
    bid.reviewedAt = new Date();
    if (status === AuctionBidStatus.UNDER_REVIEW || status === AuctionBidStatus.SHORTLISTED) {
      if (bid.auction.status !== AuctionStatus.REVIEWING && bid.auction.status !== AuctionStatus.SELECTED) {
        bid.auction.status = AuctionStatus.REVIEWING;
        await this.auctionRepository.save(bid.auction);
      }
    }
    if (status === AuctionBidStatus.REJECTED && reason) {
      bid.withdrawalReason = reason;
    }
    return await this.auctionBidRepository.save(bid);
  }

  async createQuotationSession(userId: string, createDto: CreateQuotationSessionDto): Promise<AIQuotationSession> {
    const sessionNumber = `Q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const session = this.quotationSessionRepository.create({
      ...createDto,
      userId,
      sessionNumber,
      status: QuotationSessionStatus.IN_PROGRESS,
      preferredDate: createDto.preferredDate ? new Date(createDto.preferredDate) : null,
      conversationHistory: [],
    });
    return this.quotationSessionRepository.save(session);
  }

  async findAllQuotationSessions(userId: string) {
    const [items, total] = await this.quotationSessionRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return { items, total };
  }

  async findOneQuotationSession(id: string): Promise<AIQuotationSession> {
    const session = await this.quotationSessionRepository.findOne({
      where: { id },
      relations: ['user', 'auction'],
    });
    if (!session) {
      throw new NotFoundException(`Quotation session with ID ${id} not found`);
    }
    return session;
  }

  async addMessageToSession(
    sessionId: string,
    userId: string,
    addMessageDto: AddMessageToSessionDto,
  ): Promise<AIQuotationSession> {
    const session = await this.findOneQuotationSession(sessionId);
    if (session.userId !== userId) {
      throw new BadRequestException('You can only add messages to your own sessions');
    }
    if (!session.conversationHistory) {
      session.conversationHistory = [];
    }
    session.conversationHistory.push({
      role: 'user',
      message: addMessageDto.message,
      timestamp: new Date().toISOString(),
      metadata: addMessageDto.metadata,
    });
    session.conversationHistory.push({
      role: 'ai',
      message: 'Thank you for your message. I will process this information.',
      timestamp: new Date().toISOString(),
    });
    return this.quotationSessionRepository.save(session);
  }

  async completeQuotationSession(sessionId: string, userId: string): Promise<AIQuotationSession> {
    const session = await this.findOneQuotationSession(sessionId);
    if (session.userId !== userId) {
      throw new BadRequestException('You can only complete your own sessions');
    }
    session.status = QuotationSessionStatus.COMPLETED;
    session.completedAt = new Date();
    return this.quotationSessionRepository.save(session);
  }

  async convertSessionToAuction(sessionId: string, userId: string) {
    const session = await this.findOneQuotationSession(sessionId);
    if (session.userId !== userId) {
      throw new BadRequestException('You can only convert your own sessions');
    }
    if (session.convertedToAuction) {
      throw new BadRequestException('Session already converted to auction');
    }
    const auctionDto: CreateAuctionDto = {
      serviceCategoryId: session.serviceCategory,
      serviceTitle: session.serviceDescription?.substring(0, 255) || 'Service Request',
      serviceDescription: session.serviceDescription || '',
      serviceLocation: session.location || '',
      preferredDate: session.preferredDate?.toISOString(),
      preferredTime: session.preferredTime,
      budgetMin: session.budgetRangeMin,
      budgetMax: session.budgetRangeMax,
      photos: session.photos,
    } as CreateAuctionDto;
    const auction = await this.createAuction(userId, auctionDto);
    session.convertedToAuction = true;
    session.auctionId = auction.id;
    session.status = QuotationSessionStatus.COMPLETED;
    session.completedAt = new Date();
    const updatedSession = await this.quotationSessionRepository.save(session);
    return { session: updatedSession, auction };
  }
}
