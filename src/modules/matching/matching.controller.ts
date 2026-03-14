import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { MatchingService } from './matching.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { CreateAuctionBidDto } from './dto/create-auction-bid.dto';
import { UpdateAuctionBidDto } from './dto/update-auction-bid.dto';
import { CreateQuotationSessionDto } from './dto/create-quotation-session.dto';
import { AddMessageToSessionDto } from './dto/add-message-to-session.dto';
import { UpdateBidStatusDto } from './dto/update-bid-status.dto';
import { AuctionStatus } from './entities/auction.entity';

@ApiTags('matching')
@Controller('matching')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('recommendations')
  @ApiOperation({ summary: 'AI-based service recommendations' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Recommended services list returned' })
  getRecommendations(
    @GetUser() user: any,
    @Query('category') category?: string,
    @Query('limit') limit?: number,
  ) {
    return this.matchingService.getRecommendations(
      user.id,
      category,
      limit ? Number(limit) : 10,
    );
  }

  // Auctions APIs
  @Post('auctions')
  @ApiOperation({ summary: 'Create auction' })
  @ApiOkResponse({ description: 'Auction created successfully' })
  createAuction(@GetUser() user: any, @Body() createAuctionDto: CreateAuctionDto) {
    return this.matchingService.createAuction(user.id, createAuctionDto);
  }

  @Get('auctions')
  @ApiOperation({ summary: 'Get auction list' })
  @ApiQuery({ name: 'status', required: false, enum: AuctionStatus })
  @ApiOkResponse({ description: 'Auction list returned' })
  findAllAuctions(@GetUser() user: any, @Query('status') status?: AuctionStatus) {
    return this.matchingService.findAllAuctions(user.id, status);
  }

  @Get('auctions/search')
  @ApiOperation({ 
    summary: 'Search auctions',
    description: 'Search auctions with combined filters. When no results, debug info shows per-filter counts.'
  })
  @ApiQuery({ name: 'keyword', required: false, description: 'Search in title and description' })
  @ApiQuery({ name: 'category', required: false, description: 'Service category ID (UUID)' })
  @ApiQuery({ name: 'status', required: false, enum: AuctionStatus, description: 'Auction status: draft, published, bidding, reviewing, selected, expired, cancelled' })
  @ApiQuery({ name: 'location', required: false, description: 'Search in location (case-insensitive partial match)' })
  @ApiQuery({ name: 'budgetMin', required: false, type: Number, description: 'Minimum budget' })
  @ApiQuery({ name: 'budgetMax', required: false, type: Number, description: 'Maximum budget' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiOkResponse({ 
    description: 'Search results returned',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          description: 'List of matching auctions',
        },
        total: { type: 'number', description: 'Total search result count' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
        debug: {
          type: 'object',
          description: 'Debug info when no results (per-filter counts)',
          properties: {
            message: { type: 'string' },
            filterBreakdown: {
              type: 'object',
              properties: {
                category: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    count: { type: 'number' },
                    message: { type: 'string', nullable: true },
                  },
                },
                status: {
                  type: 'object',
                  properties: {
                    value: { type: 'string' },
                    count: { type: 'number' },
                    message: { type: 'string', nullable: true },
                  },
                },
                location: {
                  type: 'object',
                  properties: {
                    value: { type: 'string' },
                    count: { type: 'number' },
                    message: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  searchAuctions(
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
    @Query('status') status?: AuctionStatus,
    @Query('location') location?: string,
    @Query('budgetMin') budgetMin?: number,
    @Query('budgetMax') budgetMax?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.matchingService.searchAuctions({
      keyword,
      category,
      status,
      location,
      budgetMin: budgetMin ? Number(budgetMin) : undefined,
      budgetMax: budgetMax ? Number(budgetMax) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('auctions/:id')
  @ApiOperation({ summary: 'Get auction details' })
  @ApiParam({ name: 'id', description: 'Auction ID' })
  @ApiOkResponse({ description: 'Auction details returned' })
  findOneAuction(@Param('id') id: string) {
    return this.matchingService.findOneAuction(id);
  }

  @Patch('auctions/:id/publish')
  @ApiOperation({ summary: 'Publish auction' })
  @ApiParam({ name: 'id', description: 'Auction ID' })
  @ApiOkResponse({ description: 'Auction published successfully' })
  publishAuction(@Param('id') id: string) {
    return this.matchingService.publishAuction(id);
  }

  @Post('auctions/:auctionId/select-bid/:bidId')
  @ApiOperation({ 
    summary: 'Select bid and create booking',
    description: 'Select a bid and create a Booking. Auction-based booking is created; SmartContract is created after payment.'
  })
  @ApiParam({ name: 'auctionId', description: 'Auction ID' })
  @ApiParam({ name: 'bidId', description: 'Bid ID' })
  @ApiOkResponse({ 
    description: 'Bid selected successfully and booking created',
    schema: {
      type: 'object',
      properties: {
        auction: { type: 'object', description: 'Updated auction object' },
        booking: { type: 'object', description: 'Created booking object' },
      },
    },
  })
  selectBid(
    @Param('auctionId') auctionId: string,
    @Param('bidId') bidId: string,
    @Body() body: { reason?: string },
  ) {
    return this.matchingService.selectBid(auctionId, bidId, body.reason);
  }

  // Auction Bids APIs
  @Post('auction-bids')
  @ApiOperation({ 
    summary: 'Submit bid',
    description: 'Submit a bid for an auction. Include auctionId, proposedPrice, estimatedDuration (days), workPlan, portfolioItems, proposedStartDate, proposedCompletionDate, additionalComment (optional).'
  })
  @ApiOkResponse({ 
    description: 'Bid submitted successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Bid ID' },
        auctionId: { type: 'string', description: 'Auction ID' },
        providerId: { type: 'string', description: 'Provider ID' },
        proposedPrice: { type: 'number', description: 'Proposed price' },
        estimatedDuration: { type: 'number', description: 'Estimated duration (days)' },
        workPlan: { type: 'string', description: 'Work plan' },
        portfolioItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              caption: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        proposedStartDate: { type: 'string', format: 'date' },
        proposedCompletionDate: { type: 'string', format: 'date' },
        additionalComment: { type: 'string' },
        status: { type: 'string' },
        submittedAt: { type: 'string', format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  createBid(@GetUser() user: any, @Body() createBidDto: CreateAuctionBidDto) {
    // TODO: Get providerId from user
    return this.matchingService.createBid(user.id, createBidDto);
  }

  @Get('auctions/:auctionId/bids')
  @ApiOperation({ summary: 'Get bids by auction' })
  @ApiParam({ name: 'auctionId', description: 'Auction ID' })
  @ApiOkResponse({ description: 'Bid list returned' })
  findAllBids(@Param('auctionId') auctionId: string) {
    return this.matchingService.findAllBids(auctionId);
  }

  @Get('auction-bids')
  @ApiOperation({ 
    summary: 'Get bids list',
    description: 'Filter bids by providerId and status. status can be comma-separated (e.g. submitted,under_review,selected).'
  })
  @ApiQuery({ name: 'providerId', required: false, description: 'Provider ID (UUID)' })
  @ApiQuery({ name: 'status', required: false, description: 'Bid status filter (comma-separated: submitted,under_review,shortlisted,selected,rejected)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiOkResponse({ description: 'Bid list returned' })
  findBids(
    @Query('providerId') providerId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.matchingService.findBids(providerId, status, page || 1, limit || 20);
  }

  @Get('auction-bids/:id')
  @ApiOperation({ summary: 'Get bid details' })
  @ApiParam({ name: 'id', description: 'Bid ID' })
  @ApiOkResponse({ description: 'Bid details returned' })
  findOneBid(@Param('id') id: string) {
    return this.matchingService.findOneBid(id);
  }

  @Put('auction-bids/:id')
  @ApiOperation({
    summary: 'Update bid',
    description: 'Update your bid (proposedPrice, estimatedDuration, workPlan, portfolioItems, proposedStartDate, proposedCompletionDate, additionalComment). Only allowed for your own bid when status is submitted.',
  })
  @ApiParam({ name: 'id', description: 'Bid ID' })
  @ApiOkResponse({ description: 'Bid updated successfully' })
  updateBid(
    @GetUser() user: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateAuctionBidDto,
  ) {
    return this.matchingService.updateBid(id, user.id, updateDto);
  }

  @Patch('auction-bids/:bidId/status')
  @ApiOperation({
    summary: 'Update bid status',
    description: 'Change bid status to under_review, shortlisted, or rejected.',
  })
  @ApiParam({ name: 'bidId', description: 'Bid ID' })
  @ApiOkResponse({
    description: 'Bid status updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: { type: 'string', enum: ['under_review', 'shortlisted', 'rejected'] },
        reviewedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  updateBidStatus(
    @Param('bidId') bidId: string,
    @Body() updateDto: UpdateBidStatusDto,
  ) {
    return this.matchingService.updateBidStatus(bidId, updateDto.status, updateDto.reason);
  }

  // AI Quotation Sessions APIs
  @Post('quotation-sessions')
  @ApiOperation({ summary: 'Create AI quotation session' })
  @ApiOkResponse({ description: 'Quotation session created successfully' })
  createQuotationSession(@GetUser() user: any, @Body() createDto: CreateQuotationSessionDto) {
    return this.matchingService.createQuotationSession(user.id, createDto);
  }

  @Get('quotation-sessions')
  @ApiOperation({ summary: 'Get quotation session list' })
  @ApiOkResponse({ description: 'Quotation session list returned' })
  findAllQuotationSessions(@GetUser() user: any) {
    return this.matchingService.findAllQuotationSessions(user.id);
  }

  @Get('quotation-sessions/:id')
  @ApiOperation({ summary: 'Get quotation session details' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiOkResponse({ description: 'Quotation session details returned' })
  findOneQuotationSession(@Param('id') id: string) {
    return this.matchingService.findOneQuotationSession(id);
  }

  @Post('quotation-sessions/:id/messages')
  @ApiOperation({ summary: 'Add message to quotation session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiOkResponse({ description: 'Message added successfully' })
  addMessageToSession(
    @GetUser() user: any,
    @Param('id') id: string,
    @Body() addMessageDto: AddMessageToSessionDto,
  ) {
    return this.matchingService.addMessageToSession(id, user.id, addMessageDto);
  }

  @Post('quotation-sessions/:id/complete')
  @ApiOperation({ summary: 'Complete quotation session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiOkResponse({ description: 'Quotation session completed successfully' })
  completeQuotationSession(@GetUser() user: any, @Param('id') id: string) {
    return this.matchingService.completeQuotationSession(id, user.id);
  }

  @Post('quotation-sessions/:id/convert-to-auction')
  @ApiOperation({ summary: 'Convert quotation session to auction' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiOkResponse({ description: 'Converted to auction successfully' })
  convertSessionToAuction(@GetUser() user: any, @Param('id') id: string) {
    return this.matchingService.convertSessionToAuction(id, user.id);
  }
}
