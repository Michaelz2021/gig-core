import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { RespondQuoteDto } from './dto/respond-quote.dto';
import { QuoteStatus } from './entities/quote.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('quotes')
@Controller('quotes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create quote or auction bid (Service Provider submits quote to Consumer)',
    description:
      'Service provider can submit a quote either by responding to an auction (using auctionId) or directly to a client (using clientId). If auctionId is provided, the system will create an auction bid in the auction_bids table instead of a quote. This is used for Quick Quote functionality.',
  })
  @ApiOkResponse({
    description: 'Quote or auction bid created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        quoteNumber: { type: 'string' },
        auctionId: { type: 'string', format: 'uuid', nullable: true },
        rfqId: { type: 'string', format: 'uuid', nullable: true },
        clientId: { type: 'string', format: 'uuid', nullable: true },
        providerId: { type: 'string', format: 'uuid' },
        serviceType: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        budget: { type: 'number' },
        status: {
          type: 'string',
          enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED', 'CANCELLED', 'submitted', 'under_review', 'shortlisted', 'selected', 'rejected'],
        },
        type: { type: 'string', enum: ['quote', 'auction_bid'], description: 'Type of response: quote or auction_bid' },
        proposedPrice: { type: 'number', nullable: true, description: 'Proposed price (for auction bid)' },
        estimatedDuration: { type: 'number', nullable: true, description: 'Estimated duration in days (for auction bid)' },
        workPlan: { type: 'string', nullable: true, description: 'Work plan (for auction bid)' },
        createdAt: { type: 'string', format: 'date-time' },
        submittedAt: { type: 'string', format: 'date-time', nullable: true, description: 'Submission time (for auction bid)' },
      },
    },
  })
  async create(@GetUser() user: any, @Body() createQuoteDto: CreateQuoteDto) {
    return this.quotesService.create(user.id, createQuoteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get quote request list' })
  @ApiQuery({ name: 'status', required: false, enum: QuoteStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Quote request list returned' })
  async findAll(
    @GetUser() user: any,
    @Query('status') status?: QuoteStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.quotesService.findAll(user.id, status, page || 1, limit || 20);
  }

  @Get(':quoteId')
  @ApiOperation({ summary: 'Get quote request details' })
  @ApiParam({ name: 'quoteId', description: 'Quote ID' })
  @ApiOkResponse({ description: 'Quote request details returned' })
  async findOne(@Param('quoteId') quoteId: string) {
    return this.quotesService.findOne(quoteId);
  }

  @Get(':quoteId/response')
  @ApiOperation({ summary: 'Get quote response' })
  @ApiParam({ name: 'quoteId', description: 'Quote ID' })
  @ApiOkResponse({ description: 'Quote response returned' })
  async getResponse(@Param('quoteId') quoteId: string) {
    return this.quotesService.getResponse(quoteId);
  }

  @Post(':quoteId/respond')
  @ApiOperation({ summary: 'Respond to quote' })
  @ApiParam({ name: 'quoteId', description: 'Quote ID' })
  @ApiOkResponse({ description: 'Quote response submitted successfully' })
  async respond(@GetUser() user: any, @Param('quoteId') quoteId: string, @Body() respondDto: RespondQuoteDto) {
    return this.quotesService.respond(quoteId, user.id, respondDto);
  }

  @Post(':quoteId/decline')
  @ApiOperation({ summary: 'Decline quote' })
  @ApiParam({ name: 'quoteId', description: 'Quote ID' })
  @ApiOkResponse({ description: 'Quote declined successfully' })
  async decline(@GetUser() user: any, @Param('quoteId') quoteId: string) {
    return this.quotesService.decline(quoteId, user.id);
  }
}
