import { Controller, Get, Post, Patch, Param, Body, UseGuards, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiBody, ApiBadRequestResponse, ApiForbiddenResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { CreateSmartContractDto } from './dto/create-smart-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';
import { WorkProgressReportsResponseDto, WorkProgressReportResponseDto } from './dto/work-progress-report-response.dto';
import { CreateWorkProgressReportDto } from './dto/create-work-progress-report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { BookingStatus } from './entities/booking.entity';

@ApiTags('bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create booking' })
  @ApiOkResponse({ description: 'Booking created successfully' })
  create(@GetUser() user: any, @Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(user.id, createBookingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get booking list' })
  @ApiQuery({ name: 'role', required: false, enum: ['consumer', 'provider'] })
  @ApiQuery({ name: 'status', required: false, enum: BookingStatus })
  @ApiOkResponse({ description: 'Booking list returned' })
  findAll(
    @GetUser() user: any, 
    @Query('role') role?: 'consumer' | 'provider',
    @Query('status') status?: BookingStatus
  ) {
    return this.bookingsService.findAll(user.id, role || 'consumer', status);
  }

  // Reports endpoints - must be defined BEFORE :bookingId route to ensure proper matching
  // Note: Swagger may not recognize nested dynamic parameters, but routes will work
  @Post(':bookingId/reports')
  @ApiOperation({ 
    summary: 'Create work progress report',
    description: 'Provider reports work progress. Only provider can submit; booking status must be confirmed or in_progress. One of notes, message, or content is required.',
    operationId: 'createWorkProgressReport'
  })
  @ApiParam({ 
    name: 'bookingId', 
    type: 'string', 
    format: 'uuid', 
    description: 'Booking ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ 
    type: CreateWorkProgressReportDto,
    description: 'Work progress report data'
  })
  @ApiOkResponse({ 
    description: 'Work progress report created successfully',
    type: WorkProgressReportResponseDto,
  })
  @ApiBadRequestResponse({ 
    description: 'Bad request - Invalid data or booking status',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'At least one of notes, message, or content is required' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiForbiddenResponse({ 
    description: 'Forbidden - Only provider can create reports',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Only the provider can create work progress reports' },
        error: { type: 'string', example: 'Forbidden' }
      }
    }
  })
  @ApiNotFoundResponse({ 
    description: 'Not found - Booking not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Booking with ID xxx not found' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  async createReport(
    @GetUser() user: any,
    @Param('bookingId') bookingId: string,
    @Body() createDto: CreateWorkProgressReportDto,
  ) {
    const report = await this.bookingsService.createWorkProgressReport(
      bookingId,
      user.id,
      createDto,
    );
    return report;
  }

  @Get(':bookingId/reports')
  @ApiOperation({ 
    summary: 'Get work progress reports for a booking',
    operationId: 'getBookingReports',
  })
  @ApiParam({ 
    name: 'bookingId', 
    type: 'string', 
    format: 'uuid', 
    description: 'Booking ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({ 
    description: 'Work progress reports returned',
    type: WorkProgressReportsResponseDto,
  })
  async getReports(@Param('bookingId') bookingId: string) {
    const reports = await this.bookingsService.findAllReports(bookingId);
    return {
      success: true,
      data: reports,
    };
  }

  @Get(':bookingId/progress-reports')
  @ApiOperation({ 
    summary: 'Get work progress reports for a booking (alternative endpoint)',
    operationId: 'getBookingProgressReports',
  })
  @ApiParam({ 
    name: 'bookingId', 
    type: 'string', 
    format: 'uuid', 
    description: 'Booking ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({ 
    description: 'Work progress reports returned',
    type: WorkProgressReportsResponseDto,
  })
  async getProgressReports(@Param('bookingId') bookingId: string) {
    const reports = await this.bookingsService.findAllReports(bookingId);
    return {
      success: true,
      data: reports,
    };
  }

  @Get(':bookingId/reports/progress')
  @ApiOperation({ 
    summary: 'Get work progress reports for a booking (alternative endpoint)',
    operationId: 'getBookingReportsProgress',
  })
  @ApiParam({ 
    name: 'bookingId', 
    type: 'string', 
    format: 'uuid', 
    description: 'Booking ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({ 
    description: 'Work progress reports returned',
    type: WorkProgressReportsResponseDto,
  })
  async getReportsProgress(@Param('bookingId') bookingId: string) {
    const reports = await this.bookingsService.findAllReports(bookingId);
    return {
      success: true,
      data: reports,
    };
  }

  @Get(':bookingId')
  @ApiOperation({ summary: 'Get booking details' })
  @ApiParam({ name: 'bookingId', type: 'string', description: 'Booking ID' })
  @ApiOkResponse({ description: 'Booking details returned' })
  findOne(@Param('bookingId') bookingId: string) {
    return this.bookingsService.findOne(bookingId);
  }

  @Patch(':bookingId/status')
  @ApiOperation({ summary: 'Update booking status' })
  @ApiOkResponse({ description: 'Booking status updated successfully' })
  updateStatus(@Param('bookingId') bookingId: string, @Body() updateDto: UpdateBookingStatusDto) {
    return this.bookingsService.updateStatus(bookingId, updateDto.status);
  }

  @Post(':bookingId/confirm')
  @ApiOperation({ summary: 'Confirm booking' })
  @ApiOkResponse({ description: 'Booking confirmed successfully' })
  confirm(@Param('bookingId') bookingId: string) {
    return this.bookingsService.confirm(bookingId);
  }

  @Post(':bookingId/complete')
  @ApiOperation({ summary: 'Complete booking' })
  @ApiOkResponse({ description: 'Booking completed successfully' })
  complete(@Param('bookingId') bookingId: string) {
    return this.bookingsService.complete(bookingId);
  }

  @Post(':bookingId/dispute')
  @ApiOperation({ summary: 'File dispute' })
  @ApiOkResponse({ description: 'Dispute filed successfully' })
  dispute(@Param('bookingId') bookingId: string) {
    return this.bookingsService.updateStatus(bookingId, 'disputed' as any);
  }

  // Smart Contracts APIs
  @Post('smart-contracts')
  @ApiOperation({ summary: 'Create smart contract' })
  @ApiOkResponse({ description: 'Smart contract created successfully' })
  createSmartContract(@GetUser() user: any, @Body() createDto: CreateSmartContractDto) {
    return this.bookingsService.createSmartContract(user.id, createDto);
  }

  @Get('smart-contracts')
  @ApiOperation({ summary: 'Get smart contract list' })
  @ApiQuery({ name: 'bookingId', required: false })
  @ApiOkResponse({ description: 'Smart contract list returned' })
  findAllSmartContracts(@GetUser() user: any, @Query('bookingId') bookingId?: string) {
    return this.bookingsService.findAllSmartContracts(bookingId, user.id);
  }

  @Get('smart-contracts/:booking_number')
  @ApiOperation({
    summary: 'Get smart contract by booking number',
    description: '예약 번호(booking_number)로 계약서 상세 조회. Path 파라미터는 booking_number 입니다.',
    operationId: 'getSmartContractByBookingNumber',
  })
  @ApiParam({
    name: 'booking_number',
    description: 'Booking number (예약 번호, e.g. BOOK-1770013267973-ADRLFB5T)',
    example: 'BOOK-1770013267973-ADRLFB5T',
    schema: { type: 'string', example: 'BOOK-1770013267973-ADRLFB5T' },
  })
  @ApiOkResponse({ description: 'Smart contract details returned' })
  findOneSmartContract(@Param('booking_number') bookingNumber: string) {
    return this.bookingsService.findOneSmartContractByBookingNumber(bookingNumber);
  }

  @Post('smart-contracts/:booking_number/sign')
  @ApiOperation({ summary: 'Sign smart contract (consumer signs; sets consumer_signed_at)' })
  @ApiParam({
    name: 'booking_number',
    description: 'Booking number (예약 번호)',
    example: 'BOOK-1770013267973-ADRLFB5TO',
    schema: { type: 'string', example: 'BOOK-1770013267973-ADRLFB5TO' },
  })
  @ApiOkResponse({ description: 'Contract signed successfully' })
  signContract(
    @GetUser() user: any,
    @Param('booking_number') bookingNumber: string,
    @Body() signDto: SignContractDto,
    @Req() req: any,
  ) {
    const ip = req.ip || req.connection.remoteAddress;
    return this.bookingsService.signContractByBookingNumber(bookingNumber, user.id, signDto.signature, ip);
  }

  @Post('smart-contracts/:booking_number/complete')
  @ApiOperation({
    summary: 'Complete contract by booking number (provider signs; set provider_signed_at & booking in_progress)',
    description: '예약 번호(booking_number)로 contracts 테이블의 provider_signed_at 을 기록하고, bookings.status 를 in_progress 로 변경합니다.',
  })
  @ApiParam({
    name: 'booking_number',
    description: 'Booking number (예약 번호)',
    example: 'BOOK-1770013267973-ADRLFB5T',
    schema: { type: 'string', example: 'BOOK-1770013267973-ADRLFB5T' },
  })
  @ApiOkResponse({ description: 'Contract completed successfully' })
  completeContract(
    @GetUser() user: any,
    @Param('booking_number') bookingNumber: string,
  ) {
    return this.bookingsService.completeContractByBookingNumber(bookingNumber, user.id);
  }
}
