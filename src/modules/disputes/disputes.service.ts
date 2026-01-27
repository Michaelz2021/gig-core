import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dispute, DisputeStatus } from './entities/dispute.entity';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { BookingsService } from '../bookings/bookings.service';

@Injectable()
export class DisputesService {
  constructor(
    @InjectRepository(Dispute)
    private readonly disputeRepository: Repository<Dispute>,
    private readonly bookingsService: BookingsService,
  ) {}

  async create(raisedBy: string, createDisputeDto: CreateDisputeDto): Promise<Dispute> {
    const booking = await this.bookingsService.findOne(createDisputeDto.bookingId);

    // Only consumer or provider can raise dispute
    if (booking.consumerId !== raisedBy && booking.providerId !== raisedBy) {
      throw new BadRequestException('You can only raise dispute for your own bookings');
    }

    // Check if dispute already exists
    const existingDispute = await this.disputeRepository.findOne({
      where: { bookingId: createDisputeDto.bookingId },
    });

    if (existingDispute) {
      throw new BadRequestException('Dispute already exists for this booking');
    }

    const dispute = this.disputeRepository.create({
      ...createDisputeDto,
      raisedBy,
    });

    const savedDispute = await this.disputeRepository.save(dispute);

    // Update booking status
    await this.bookingsService.updateStatus(createDisputeDto.bookingId, 'disputed' as any);

    return savedDispute;
  }

  async findAll(userId?: string): Promise<Dispute[]> {
    if (userId) {
      return this.disputeRepository.find({
        where: { raisedBy: userId },
        relations: ['booking', 'raisedByUser'],
        order: { createdAt: 'DESC' },
      });
    }

    return this.disputeRepository.find({
      relations: ['booking', 'raisedByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Dispute> {
    return this.disputeRepository.findOne({
      where: { id },
      relations: ['booking', 'raisedByUser'],
    });
  }

  async updateStatus(id: string, status: DisputeStatus, resolution?: string): Promise<Dispute> {
    const dispute = await this.findOne(id);
    dispute.status = status;
    if (resolution) {
      dispute.resolution = resolution;
    }
    return this.disputeRepository.save(dispute);
  }
}

