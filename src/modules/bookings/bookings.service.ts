import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Booking, BookingStatus } from './entities/booking.entity';
import { SmartContract, SmartContractStatus } from './entities/smart-contract.entity';
import { WorkProgressReport, ReportType } from './entities/work-progress-report.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateSmartContractDto } from './dto/create-smart-contract.dto';
import { CreateWorkProgressReportDto } from './dto/create-work-progress-report.dto';
import { ServicesService } from '../services/services.service';
import { UsersService } from '../users/users.service';
import * as crypto from 'crypto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(SmartContract)
    private readonly smartContractRepository: Repository<SmartContract>,
    @InjectRepository(WorkProgressReport)
    private readonly workProgressReportRepository: Repository<WorkProgressReport>,
    private readonly servicesService: ServicesService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  private generateBookingNumber(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `BOOK-${timestamp}-${random}`;
  }

  async create(consumerId: string, createBookingDto: CreateBookingDto): Promise<Booking> {
    const service = await this.servicesService.findOne(createBookingDto.serviceId);
    
    if (!service || !service.isActive) {
      throw new NotFoundException('Service not found or inactive');
    }

    if (service.providerId === consumerId) {
      throw new BadRequestException('Cannot book your own service');
    }

    const bookingNumber = this.generateBookingNumber();
    const booking = this.bookingRepository.create({
      ...createBookingDto,
      bookingNumber,
      consumerId,
      providerId: service.providerId,
      scheduledDate: new Date(createBookingDto.scheduledDate),
    });

    return this.bookingRepository.save(booking);
  }

  /**
   * Auction 기반 Booking 생성
   * 낙찰 승인 시 자동으로 호출됨
   */
  async createFromAuction(auctionId: string, bidId: string): Promise<Booking> {
    // Auction과 Bid 정보 조회
    const auction = await this.bookingRepository.manager.query(
      `
      SELECT 
        a.id,
        a.consumer_id,
        a.service_title,
        a.service_description,
        a.service_location,
        a.location_latitude,
        a.location_longitude,
        a.preferred_date,
        a.preferred_time
      FROM auctions a
      WHERE a.id = $1
      `,
      [auctionId],
    );

    if (!auction || auction.length === 0) {
      throw new NotFoundException(`Auction with ID ${auctionId} not found`);
    }

    const auctionData = auction[0];

    const bid = await this.bookingRepository.manager.query(
      `
      SELECT 
        b.id,
        b.provider_id,
        b.proposed_price,
        b.estimated_duration,
        b.work_plan,
        b.proposed_start_date,
        b.proposed_completion_date,
        p.user_id as provider_user_id
      FROM auction_bids b
      JOIN providers p ON b.provider_id = p.id
      WHERE b.id = $1
      `,
      [bidId],
    );

    if (!bid || bid.length === 0) {
      throw new NotFoundException(`Bid with ID ${bidId} not found`);
    }

    const bidData = bid[0];

    // 금액 계산
    const proposedPrice = parseFloat(String(bidData.proposed_price || 0));
    const platformFee = Math.round(proposedPrice * 0.07 * 100) / 100; // 7% 플랫폼 수수료
    const insuranceFee = 0; // 기본값 0
    const totalAmount = proposedPrice + platformFee + insuranceFee;

    // 일정 설정
    const scheduledDate = bidData.proposed_start_date 
      ? new Date(bidData.proposed_start_date)
      : (auctionData.preferred_date ? new Date(auctionData.preferred_date) : new Date());

    // 예약 종료일 계산
    let scheduledEndDate: Date | undefined;
    if (bidData.proposed_completion_date) {
      scheduledEndDate = new Date(bidData.proposed_completion_date);
    } else if (bidData.estimated_duration) {
      scheduledEndDate = new Date(scheduledDate);
      scheduledEndDate.setDate(scheduledEndDate.getDate() + bidData.estimated_duration);
    }

    // Booking 생성
    const bookingNumber = this.generateBookingNumber();
    const booking = this.bookingRepository.create({
      bookingNumber,
      consumerId: auctionData.consumer_id,
      providerId: bidData.provider_id,
      serviceId: null, // Auction 기반은 serviceId 없음
      scheduledDate,
      scheduledEndDate,
      durationMinutes: bidData.estimated_duration ? bidData.estimated_duration * 24 * 60 : null,
      locationAddress: auctionData.service_location,
      locationLatitude: auctionData.location_latitude ? parseFloat(String(auctionData.location_latitude)) : null,
      locationLongitude: auctionData.location_longitude ? parseFloat(String(auctionData.location_longitude)) : null,
      serviceRate: proposedPrice,
      subtotal: proposedPrice,
      platformFee,
      insuranceFee,
      totalAmount,
      serviceDescription: bidData.work_plan || auctionData.service_description,
      specialInstructions: auctionData.service_description,
      status: BookingStatus.PENDING_PAYMENT, // 결제 대기 상태
      auctionId: auctionId,
      auctionBidId: bidId,
      isInstantBooking: false,
    });

    return this.bookingRepository.save(booking);
  }

  /**
   * JWT의 userId와 role(consumer/provider)를 기준으로 예약 목록 조회
   * - consumer: bookings.consumer_id = userId
   * - provider: providers.user_id = userId (조인해서 조회)
   */
  async findAll(userId: string, role: 'consumer' | 'provider' = 'consumer', status?: BookingStatus) {
    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.consumer', 'consumer')
      .leftJoinAndSelect('booking.provider', 'provider')
      .leftJoinAndSelect('booking.service', 'service')
      .addSelect('booking.status'); // status 필드 명시적으로 포함

    if (role === 'consumer') {
      queryBuilder.where('booking.consumerId = :userId', { userId });
    } else {
      // provider 역할: providers.user_id = userId
      queryBuilder.where('provider.userId = :userId', { userId });
    }

    if (status) {
      queryBuilder.andWhere('booking.status = :status', { status });
    }

    queryBuilder.orderBy('booking.createdAt', 'DESC');

    const [items, total] = await queryBuilder.getManyAndCount();

    return { items, total };
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['service', 'consumer', 'provider', 'auction', 'auctionBid'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  async updateStatus(id: string, status: BookingStatus): Promise<Booking> {
    const booking = await this.findOne(id);
    booking.status = status;
    
    if (status === BookingStatus.COMPLETED) {
      booking.actualEndTime = new Date();
    }

    return this.bookingRepository.save(booking);
  }

  async confirm(id: string): Promise<Booking> {
    return this.updateStatus(id, BookingStatus.CONFIRMED);
  }

  async complete(id: string): Promise<Booking> {
    return this.updateStatus(id, BookingStatus.COMPLETED);
  }

  async cancel(id: string): Promise<Booking> {
    return this.updateStatus(id, BookingStatus.CANCELLED);
  }

  /**
   * Auction 기반 Booking의 결제 완료 후 SmartContract 자동 생성
   */
  async createSmartContractFromAuction(bookingId: string): Promise<SmartContract> {
    const booking = await this.findOne(bookingId);

    // Auction 기반 booking인지 확인
    if (!booking.auctionId || !booking.auctionBidId) {
      throw new BadRequestException('This booking is not from an auction');
    }

    // 이미 SmartContract가 존재하는지 확인
    const existingContract = await this.smartContractRepository.findOne({
      where: { bookingId },
    });

    if (existingContract) {
      return existingContract; // 이미 생성된 계약이 있으면 반환
    }

    // Auction과 Bid 정보 조회
    const auctionData = await this.bookingRepository.manager.query(
      `
      SELECT id, service_title, service_description, service_requirements
      FROM auctions
      WHERE id = $1
      `,
      [booking.auctionId],
    );

    const bidData = await this.bookingRepository.manager.query(
      `
      SELECT id, work_plan, proposed_start_date, proposed_completion_date
      FROM auction_bids
      WHERE id = $1
      `,
      [booking.auctionBidId],
    );

    const auction = auctionData[0];
    const bid = bidData[0];

    // 계약 조건 구성
    const contractTerms = {
      scopeOfWork: auction.service_description || '',
      deliverables: bid.work_plan ? [bid.work_plan] : [],
      timeline: {
        startDate: bid.proposed_start_date || booking.scheduledDate,
        completionDate: bid.proposed_completion_date || booking.scheduledEndDate,
      },
      paymentTerms: {
        totalAmount: booking.totalAmount,
        serviceRate: booking.serviceRate,
        platformFee: booking.platformFee,
        insuranceFee: booking.insuranceFee,
      },
    };

    const contractNumber = `CNT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const contract = this.smartContractRepository.create({
      bookingId: booking.id,
      consumerId: booking.consumerId,
      providerId: booking.providerId,
      contractNumber,
      contractTerms,
      status: SmartContractStatus.PENDING_SIGNATURES, // 서명 대기 상태
      auctionId: booking.auctionId,
      auctionBidId: booking.auctionBidId,
    });

    return this.smartContractRepository.save(contract);
  }

  // Smart Contracts APIs
  async createSmartContract(userId: string, createDto: CreateSmartContractDto): Promise<SmartContract> {
    const booking = await this.findOne(createDto.bookingId);

    if (booking.consumerId !== userId && booking.providerId !== userId) {
      throw new BadRequestException('You can only create contracts for your own bookings');
    }

    const contractNumber = `CNT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const contract = this.smartContractRepository.create({
      ...createDto,
      consumerId: booking.consumerId,
      providerId: booking.providerId,
      contractNumber,
      status: SmartContractStatus.DRAFT,
    });

    return this.smartContractRepository.save(contract);
  }

  async findAllSmartContracts(bookingId?: string, userId?: string) {
    const where: any = {};
    if (bookingId) {
      where.bookingId = bookingId;
    }
    if (userId) {
      where.consumerId = userId;
      // Also include contracts where user is provider
      // This requires a more complex query
    }

    const [items, total] = await this.smartContractRepository.findAndCount({
      where: bookingId ? { bookingId } : userId ? [
        { consumerId: userId },
        { providerId: userId },
      ] : {},
      relations: ['booking', 'consumer', 'provider'],
      order: { createdAt: 'DESC' },
    });

    return { items, total };
  }

  async findOneSmartContract(id: string): Promise<SmartContract> {
    const contract = await this.smartContractRepository.findOne({
      where: { id },
      relations: ['booking', 'consumer', 'provider'],
    });

    if (!contract) {
      throw new NotFoundException(`Smart contract with ID ${id} not found`);
    }

    return contract;
  }

  async signContract(contractId: string, userId: string, signature: string, ip: string): Promise<SmartContract> {
    const contract = await this.findOneSmartContract(contractId);

    if (contract.consumerId === userId) {
      if (contract.consumerSignature) {
        throw new BadRequestException('Contract already signed by consumer');
      }
      contract.consumerSignature = signature;
      contract.consumerSignedAt = new Date();
      contract.consumerIp = ip;
    } else if (contract.providerId === userId) {
      if (contract.providerSignature) {
        throw new BadRequestException('Contract already signed by provider');
      }
      contract.providerSignature = signature;
      contract.providerSignedAt = new Date();
      contract.providerIp = ip;
    } else {
      throw new BadRequestException('You are not authorized to sign this contract');
    }

    // Generate contract hash
    const contractData = JSON.stringify({
      contractNumber: contract.contractNumber,
      bookingId: contract.bookingId,
      contractTerms: contract.contractTerms,
      consumerSignature: contract.consumerSignature,
      providerSignature: contract.providerSignature,
    });
    contract.contractHash = crypto.createHash('sha256').update(contractData).digest('hex');

    // Update status if both parties signed
    if (contract.consumerSignature && contract.providerSignature) {
      contract.status = SmartContractStatus.ACTIVE;
    } else {
      contract.status = SmartContractStatus.PENDING_SIGNATURES;
    }

    return this.smartContractRepository.save(contract);
  }

  async completeContract(contractId: string, userId: string, completionProof: any): Promise<SmartContract> {
    const contract = await this.findOneSmartContract(contractId);

    if (contract.consumerId !== userId && contract.providerId !== userId) {
      throw new BadRequestException('You are not authorized to complete this contract');
    }

    if (contract.status !== SmartContractStatus.ACTIVE) {
      throw new BadRequestException('Contract must be active to complete');
    }

    contract.completionProof = completionProof;
    contract.completionConfirmedAt = new Date();
    contract.status = SmartContractStatus.COMPLETED;

    return this.smartContractRepository.save(contract);
  }

  /**
   * Booking의 작업 진행 리포트 조회
   */
  async findAllReports(bookingId: string): Promise<WorkProgressReport[]> {
    // Booking 존재 확인
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    // 리포트 조회 (최신순 정렬)
    const reports = await this.workProgressReportRepository.find({
      where: { bookingId },
      order: { createdAt: 'DESC' },
    });

    return reports;
  }

  /**
   * 작업 진행 리포트 생성
   * Provider만 보고서를 작성할 수 있음
   */
  async createWorkProgressReport(
    bookingId: string,
    userId: string,
    createDto: CreateWorkProgressReportDto,
  ): Promise<WorkProgressReport> {
    // 1. Booking 존재 확인 및 권한 검증
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['provider', 'provider.user'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    // 2. Provider만 보고서 작성 가능
    // booking.providerId는 Provider 테이블의 id이고, 
    // userId는 User 테이블의 id이므로 provider.userId와 비교해야 함
    if (!booking.provider) {
      throw new NotFoundException('Provider not found for this booking');
    }

    // Provider의 userId와 현재 사용자의 userId 비교
    if (booking.provider.userId !== userId) {
      throw new ForbiddenException('Only the provider can create work progress reports');
    }

    // 3. Booking 상태 확인 (진행 중이거나 확인된 상태만 가능)
    if (
      booking.status !== BookingStatus.IN_PROGRESS &&
      booking.status !== BookingStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        `Cannot create report for booking with status: ${booking.status}. Only bookings with status 'confirmed' or 'in_progress' can have progress reports.`,
      );
    }

    // 4. 메시지 필드 검증 (notes, message, content 중 하나는 필수)
    if (!createDto.notes && !createDto.message && !createDto.content) {
      throw new BadRequestException(
        'At least one of notes, message, or content is required',
      );
    }

    // 5. 이미지 URL 처리 (상대 경로를 절대 URL로 변환)
    const baseUrl = this.configService.get<string>('BASE_URL') || 
                   `http://${this.configService.get<string>('HOST', 'localhost')}:${this.configService.get<number>('PORT', 3000)}`;

    const processImageUrl = (url: string | { url: string; caption?: string }): string | { url: string; caption?: string } => {
      if (typeof url === 'string') {
        // 이미 절대 URL인 경우 그대로 반환
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return url;
        }
        // 상대 경로인 경우 절대 URL로 변환 (API prefix 없이)
        if (url.startsWith('/')) {
          return `${baseUrl}${url}`;
        }
        // 상대 경로가 아닌 경우 / 추가 후 변환
        return `${baseUrl}/${url}`;
      } else {
        // 객체인 경우
        let processedUrl = url.url;
        if (processedUrl.startsWith('http://') || processedUrl.startsWith('https://')) {
          // 이미 절대 URL
        } else if (processedUrl.startsWith('/')) {
          processedUrl = `${baseUrl}${processedUrl}`;
        } else {
          processedUrl = `${baseUrl}/${processedUrl}`;
        }
        return {
          url: processedUrl,
          caption: url.caption,
        };
      }
    };

    const processedPhotos = (createDto.photos || []).map(processImageUrl);
    const processedEvidence = (createDto.evidence || []).map((ev) => {
      let processedUrl = ev.url;
      // 이미 절대 URL인 경우 그대로 사용
      if (processedUrl.startsWith('http://') || processedUrl.startsWith('https://')) {
        // 그대로 유지
      } else if (processedUrl.startsWith('/')) {
        // 상대 경로인 경우 절대 URL로 변환 (API prefix 없이)
        processedUrl = `${baseUrl}${processedUrl}`;
      } else {
        // 상대 경로가 아닌 경우 / 추가 후 변환
        processedUrl = `${baseUrl}/${processedUrl}`;
      }
      return {
        type: ev.type,
        url: processedUrl,
        caption: ev.caption,
      };
    });

    // 6. WorkProgressReport 생성
    const report = this.workProgressReportRepository.create({
      bookingId,
      reportType: ReportType.PROGRESS,
      notes: createDto.notes,
      message: createDto.message,
      content: createDto.content,
      progressPercentage: createDto.progressPercentage,
      completedTasks: createDto.completedTasks || [],
      photos: processedPhotos,
      evidence: processedEvidence,
      nextSteps: createDto.nextSteps || [],
      estimatedCompletion: createDto.estimatedCompletion
        ? new Date(createDto.estimatedCompletion)
        : undefined,
      reportedAt: createDto.reportedAt
        ? new Date(createDto.reportedAt)
        : new Date(),
    });

    // 7. 저장
    const savedReport = await this.workProgressReportRepository.save(report);

    return savedReport;
  }
}

