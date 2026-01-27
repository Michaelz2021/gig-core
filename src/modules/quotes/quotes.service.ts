import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quote, QuoteStatus } from './entities/quote.entity';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { RespondQuoteDto } from './dto/respond-quote.dto';
import { UsersService } from '../users/users.service';
import { RfqService } from './rfq.service';
import { S3Service } from '../upload/s3.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { MatchingService } from '../matching/matching.service';

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(Quote)
    private readonly quoteRepository: Repository<Quote>,
    private readonly usersService: UsersService,
    private readonly rfqService: RfqService,
    private readonly s3Service: S3Service,
    private readonly notificationsService: NotificationsService,
    private readonly matchingService: MatchingService,
  ) {}

  async create(providerId: string, createQuoteDto: CreateQuoteDto): Promise<any> {
    if (createQuoteDto.auctionId) {
      try {
        const provider = await this.usersService.getProviderByUserId(providerId);
        if (!provider) {
          throw new BadRequestException('Provider profile not found. Please complete your provider profile first.');
        }
        if (createQuoteDto.providerId !== providerId) {
          throw new BadRequestException('Provider ID mismatch');
        }
        let estimatedDuration = undefined;
        if (createQuoteDto.timeline) {
          const timelineValue = parseFloat(createQuoteDto.timeline);
          if (!isNaN(timelineValue)) {
            estimatedDuration = timelineValue;
          }
        }
        let proposedStartDate = null;
        let proposedCompletionDate = null;
        if (createQuoteDto.preferredSchedule) {
          proposedStartDate = new Date(createQuoteDto.preferredSchedule);
          if (estimatedDuration) {
            proposedCompletionDate = new Date(proposedStartDate);
            proposedCompletionDate.setDate(proposedCompletionDate.getDate() + Math.ceil(estimatedDuration));
          }
        }
        let additionalComment = undefined;
        if (createQuoteDto.requirements && createQuoteDto.requirements.length > 0) {
          additionalComment = createQuoteDto.requirements.join('\n');
        }
        const createBidDto: any = {
          auctionId: createQuoteDto.auctionId,
          proposedPrice: createQuoteDto.budget,
          estimatedDuration: estimatedDuration,
          workPlan: createQuoteDto.description || '',
          portfolioItems: [],
          proposedStartDate: proposedStartDate ? proposedStartDate.toISOString().split('T')[0] : undefined,
          proposedCompletionDate: proposedCompletionDate ? proposedCompletionDate.toISOString().split('T')[0] : undefined,
          additionalComment: additionalComment,
        };
        const auctionBid = await this.matchingService.createBid(providerId, createBidDto);
        return {
          id: auctionBid.id,
          quoteNumber: `QUOTE-${auctionBid.id.substring(0, 8).toUpperCase()}`,
          auctionId: auctionBid.auctionId,
          providerId: providerId,
          serviceType: createQuoteDto.serviceType,
          title: createQuoteDto.title,
          description: createQuoteDto.description,
          budget: createQuoteDto.budget,
          timeline: createQuoteDto.timeline,
          preferredSchedule: proposedStartDate,
          requirements: createQuoteDto.requirements,
          status: auctionBid.status,
          proposedPrice: auctionBid.proposedPrice,
          estimatedDuration: auctionBid.estimatedDuration,
          workPlan: auctionBid.workPlan,
          createdAt: auctionBid.createdAt,
          submittedAt: auctionBid.submittedAt,
          type: 'auction_bid',
        };
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw new BadRequestException(`Auction with ID ${createQuoteDto.auctionId} not found`);
        }
        throw error;
      }
    }
    let clientId = createQuoteDto.clientId;
    let rfqId = null;
    let s3FolderPath = null;
    if (!clientId) {
      throw new BadRequestException('Either auctionId or clientId must be provided');
    }
    if (createQuoteDto.providerId !== providerId) {
      throw new BadRequestException('Provider ID mismatch');
    }
    const quoteNumber = `QUOTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const quote = this.quoteRepository.create({
      ...createQuoteDto,
      clientId,
      rfqId,
      providerId,
      quoteNumber,
      status: QuoteStatus.PENDING,
      preferredSchedule: createQuoteDto.preferredSchedule ? new Date(createQuoteDto.preferredSchedule) : null,
      responseDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    const savedQuote = await this.quoteRepository.save(quote);
    if (s3FolderPath) {
      try {
        const quoteData = {
          quoteId: savedQuote.id,
          quoteNumber: savedQuote.quoteNumber,
          providerId: savedQuote.providerId,
          clientId: savedQuote.clientId,
          serviceType: savedQuote.serviceType,
          title: savedQuote.title,
          description: savedQuote.description,
          budget: savedQuote.budget,
          timeline: savedQuote.timeline,
          requirements: savedQuote.requirements,
          createdAt: savedQuote.createdAt.toISOString(),
        };
        const quoteFileName = `quote_${savedQuote.id}.json`;
        const quoteFilePath = `${s3FolderPath}quotes/${quoteFileName}`;
        const quoteJson = JSON.stringify(quoteData, null, 2);
        await this.s3Service.uploadFile(quoteFilePath, quoteJson, 'application/json');
        savedQuote.s3FilePath = quoteFilePath;
        await this.quoteRepository.save(savedQuote);
      } catch (error) {
        console.error('Failed to save quote to S3:', error);
      }
    }
    try {
      const provider = await this.usersService.findOne(providerId);
      const providerName = `${provider.firstName} ${provider.lastName}`;
      await this.notificationsService.send(
        clientId,
        NotificationType.QUOTE,
        'New Quote Received',
        `${providerName} has submitted a quote for your request: ${savedQuote.title}`,
        {
          quoteId: savedQuote.id,
          rfqId: rfqId,
          auctionId: createQuoteDto.auctionId,
          providerId: providerId,
          actionUrl: `/quotes/${savedQuote.id}`,
        },
      );
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
    return savedQuote;
  }

  async findAll(userId: string, status?: QuoteStatus, page: number = 1, limit: number = 20) {
    const where: any = {};
    const user = await this.usersService.findOne(userId);
    if (user.userType === 'consumer' || user.userType === 'both') {
      where.clientId = userId;
    } else {
      where.providerId = userId;
    }
    if (status) {
      where.status = status;
    }
    const skip = (page - 1) * limit;
    const [quotes, total] = await this.quoteRepository.findAndCount({
      where,
      relations: ['client', 'provider', 'provider.user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    const formattedQuotes = quotes.map((quote) => ({
      quoteId: quote.id,
      providerId: quote.providerId,
      providerName: `${quote.provider?.user?.firstName || ''} ${quote.provider?.user?.lastName || ''}`,
      serviceType: quote.serviceType,
      title: quote.title,
      status: quote.status,
      budget: quote.budget,
      createdAt: quote.createdAt,
      responseDeadline: quote.responseDeadline,
    }));
    return {
      quotes: formattedQuotes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async findOne(quoteId: string): Promise<Quote> {
    const quote = await this.quoteRepository.findOne({
      where: { id: quoteId },
      relations: ['client', 'provider', 'provider.user', 'rfq'],
    });
    if (!quote) {
      throw new NotFoundException(`Quote with ID ${quoteId} not found`);
    }
    return quote;
  }

  async getResponse(quoteId: string) {
    const quote = await this.findOne(quoteId);
    if (quote.status === QuoteStatus.PENDING) {
      return {
        quoteId: quote.id,
        status: quote.status,
        estimatedResponseTime: '24 hours',
      };
    }
    return {
      quoteId: quote.id,
      status: quote.status,
      providerResponse: {
        message: quote.providerMessage,
        proposedPrice: quote.proposedPrice,
        proposedTimeline: quote.proposedTimeline,
        milestones: quote.milestones,
      },
      respondedAt: quote.respondedAt,
    };
  }

  async respond(quoteId: string, providerId: string, respondDto: RespondQuoteDto): Promise<Quote> {
    const quote = await this.findOne(quoteId);
    if (quote.providerId !== providerId) {
      throw new BadRequestException('You are not authorized to respond to this quote');
    }
    if (quote.status !== QuoteStatus.PENDING) {
      throw new BadRequestException('Quote is not in pending status');
    }
    quote.providerMessage = respondDto.message;
    quote.proposedPrice = respondDto.proposedPrice;
    quote.proposedTimeline = respondDto.proposedTimeline;
    quote.milestones = respondDto.milestones?.map((m) => ({
      milestoneId: `milestone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: m.name,
      description: m.description,
      price: m.price,
      dueDate: new Date(m.dueDate),
    }));
    quote.status = QuoteStatus.ACCEPTED;
    quote.respondedAt = new Date();
    return this.quoteRepository.save(quote);
  }

  async decline(quoteId: string, providerId: string): Promise<Quote> {
    const quote = await this.findOne(quoteId);
    if (quote.providerId !== providerId) {
      throw new BadRequestException('You are not authorized to decline this quote');
    }
    quote.status = QuoteStatus.DECLINED;
    quote.respondedAt = new Date();
    return this.quoteRepository.save(quote);
  }
}
