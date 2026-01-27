import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RFQ, RFQStatus } from './entities/rfq.entity';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { S3Service } from '../upload/s3.service';

@Injectable()
export class RfqService {
  constructor(
    @InjectRepository(RFQ)
    private readonly rfqRepository: Repository<RFQ>,
    private readonly s3Service: S3Service,
  ) {}

  async create(consumerId: string, createRfqDto: CreateRfqDto): Promise<RFQ> {
    const rfqNumber = `RFQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const rfq = this.rfqRepository.create({
      ...createRfqDto,
      consumerId,
      rfqNumber,
      status: RFQStatus.OPEN,
      preferredSchedule: createRfqDto.preferredSchedule
        ? new Date(createRfqDto.preferredSchedule)
        : null,
      deadline: createRfqDto.deadline
        ? new Date(createRfqDto.deadline)
        : null,
    });
    const savedRfq = await this.rfqRepository.save(rfq);
    try {
      const folderPath = `rfqs/${savedRfq.id}/`;
      await this.s3Service.createFolder(folderPath);
      savedRfq.s3FolderPath = folderPath;
      await this.rfqRepository.save(savedRfq);
    } catch (error) {
      console.error('Failed to create S3 folder for RFQ:', error);
    }
    return savedRfq;
  }

  async findAll(
    consumerId?: string,
    status?: RFQStatus,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    rfqs: RFQ[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const where: any = {};
    if (consumerId) {
      where.consumerId = consumerId;
    }
    if (status) {
      where.status = status;
    }
    const skip = (page - 1) * limit;
    const [rfqs, total] = await this.rfqRepository.findAndCount({
      where,
      relations: ['consumer'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return {
      rfqs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async findOne(rfqId: string): Promise<RFQ> {
    const rfq = await this.rfqRepository.findOne({
      where: { id: rfqId },
      relations: ['consumer', 'quotes', 'quotes.provider', 'quotes.provider.user'],
    });
    if (!rfq) {
      throw new NotFoundException(`RFQ with ID ${rfqId} not found`);
    }
    return rfq;
  }

  async close(rfqId: string, consumerId: string): Promise<RFQ> {
    const rfq = await this.findOne(rfqId);
    if (rfq.consumerId !== consumerId) {
      throw new NotFoundException('You are not authorized to close this RFQ');
    }
    rfq.status = RFQStatus.CLOSED;
    return this.rfqRepository.save(rfq);
  }

  async cancel(rfqId: string, consumerId: string): Promise<RFQ> {
    const rfq = await this.findOne(rfqId);
    if (rfq.consumerId !== consumerId) {
      throw new NotFoundException('You are not authorized to cancel this RFQ');
    }
    rfq.status = RFQStatus.CANCELLED;
    return this.rfqRepository.save(rfq);
  }

  async findOrCreateByAuctionId(auctionId: string, auctionData: any): Promise<RFQ> {
    const existingRfq = await this.rfqRepository.findOne({
      where: { auctionId },
    });
    if (existingRfq) {
      return existingRfq;
    }
    const rfqNumber = `RFQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const rfq = this.rfqRepository.create({
      rfqNumber,
      consumerId: auctionData.consumerId,
      auctionId: auctionId,
      serviceType: auctionData.serviceCategoryId || 'general',
      title: auctionData.serviceTitle,
      description: auctionData.serviceDescription,
      budgetMin: auctionData.budgetMin,
      budgetMax: auctionData.budgetMax,
      location: auctionData.serviceLocation,
      photos: auctionData.photos || [],
      documents: auctionData.documents || [],
      requirements: auctionData.serviceRequirements ? [auctionData.serviceRequirements] : [],
      preferredSchedule: auctionData.preferredDate
        ? new Date(auctionData.preferredDate)
        : null,
      deadline: auctionData.deadline
        ? new Date(auctionData.deadline)
        : null,
      status: RFQStatus.OPEN,
    });
    const savedRfq = await this.rfqRepository.save(rfq);
    try {
      const folderPath = `rfqs/${savedRfq.id}/`;
      await this.s3Service.createFolder(folderPath);
      savedRfq.s3FolderPath = folderPath;
      await this.rfqRepository.save(savedRfq);
    } catch (error) {
      console.error('Failed to create S3 folder for RFQ:', error);
    }
    return savedRfq;
  }
}
