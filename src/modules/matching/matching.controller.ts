import { Controller, Get, Post, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { MatchingService } from './matching.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { CreateAuctionBidDto } from './dto/create-auction-bid.dto';
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
    description: '경매를 검색합니다. 여러 필터 조건을 조합하여 사용할 수 있습니다. 결과가 없을 경우 debug 정보가 포함되어 어떤 조건이 문제인지 확인할 수 있습니다.'
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
          description: '검색된 경매 목록',
        },
        total: { type: 'number', description: '전체 검색 결과 개수' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
        debug: {
          type: 'object',
          description: '결과가 없을 경우 디버깅 정보 (각 필터 조건별 개수)',
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
    description: '입찰을 선택하고 자동으로 Booking을 생성합니다. Auction 기반 예약이 생성되며, 결제 완료 후 SmartContract가 자동 생성됩니다.'
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
    summary: 'Submit bid (견적서 제출)',
    description: '경매에 대한 견적서를 제출합니다. auctionId, proposedPrice, estimatedDuration(일수), workPlan, portfolioItems(description 포함), proposedStartDate, proposedCompletionDate, additionalComment(optional)를 포함합니다.'
  })
  @ApiOkResponse({ 
    description: 'Bid submitted successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: '입찰 ID' },
        auctionId: { type: 'string', description: '경매 ID' },
        providerId: { type: 'string', description: '제공자 ID' },
        proposedPrice: { type: 'number', description: '제안 가격' },
        estimatedDuration: { type: 'number', description: '예상 소요 일수' },
        workPlan: { type: 'string', description: '작업 계획서' },
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
    summary: 'Get bids list (견적서 목록 조회)',
    description: 'providerId와 status로 견적서 목록을 필터링하여 조회합니다. status는 콤마로 구분된 여러 값을 전달할 수 있습니다 (예: submitted,under_review,selected).'
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

  @Patch('auction-bids/:bidId/status')
  @ApiOperation({
    summary: 'Update bid status (견적 상태 변경)',
    description: '견적서의 상태를 변경합니다. under_review, shortlisted, rejected 상태로 변경할 수 있습니다.',
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
