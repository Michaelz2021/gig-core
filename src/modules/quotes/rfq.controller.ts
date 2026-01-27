import { Controller, Get, Post, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { RfqService } from './rfq.service';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { RFQStatus } from './entities/rfq.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('rfqs')
@Controller('rfqs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class RfqController {
  constructor(private readonly rfqService: RfqService) {}

  @Post()
  @ApiOperation({ summary: 'Create RFQ (Request for Quotation)' })
  @ApiOkResponse({ description: 'RFQ created successfully' })
  create(@GetUser() user: any, @Body() createRfqDto: CreateRfqDto) {
    return this.rfqService.create(user.id, createRfqDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get RFQ list' })
  @ApiQuery({ name: 'status', required: false, enum: RFQStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'RFQ list returned' })
  findAll(
    @GetUser() user: any,
    @Query('status') status?: RFQStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    // If user is consumer, show only their RFQs. If provider, show all open RFQs
    const consumerId = user.userType === 'consumer' || user.userType === 'both' ? user.id : undefined;
    return this.rfqService.findAll(consumerId, status, page || 1, limit || 20);
  }

  @Get(':rfqId')
  @ApiOperation({ summary: 'Get RFQ details' })
  @ApiParam({ name: 'rfqId', description: 'RFQ ID' })
  @ApiOkResponse({ description: 'RFQ details returned' })
  findOne(@Param('rfqId') rfqId: string) {
    return this.rfqService.findOne(rfqId);
  }

  @Patch(':rfqId/close')
  @ApiOperation({ summary: 'Close RFQ' })
  @ApiParam({ name: 'rfqId', description: 'RFQ ID' })
  @ApiOkResponse({ description: 'RFQ closed successfully' })
  close(@GetUser() user: any, @Param('rfqId') rfqId: string) {
    return this.rfqService.close(rfqId, user.id);
  }

  @Patch(':rfqId/cancel')
  @ApiOperation({ summary: 'Cancel RFQ' })
  @ApiParam({ name: 'rfqId', description: 'RFQ ID' })
  @ApiOkResponse({ description: 'RFQ cancelled successfully' })
  cancel(@GetUser() user: any, @Param('rfqId') rfqId: string) {
    return this.rfqService.cancel(rfqId, user.id);
  }
}

