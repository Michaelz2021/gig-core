import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notice, NoticeType } from './entities/notice.entity';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';

@Injectable()
export class NoticesService {
  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
  ) {}

  async create(createNoticeDto: CreateNoticeDto, createdBy?: string): Promise<Notice> {
    const notice = this.noticeRepository.create({
      ...createNoticeDto,
      createdBy,
      publishedAt: createNoticeDto.publishedAt || new Date(),
    });

    return this.noticeRepository.save(notice);
  }

  async findAll(type?: NoticeType, isActive?: boolean): Promise<Notice[]> {
    const queryBuilder = this.noticeRepository.createQueryBuilder('notice');

    if (type) {
      queryBuilder.where('notice.type = :type', { type });
    }

    if (isActive !== undefined) {
      if (type) {
        queryBuilder.andWhere('notice.isActive = :isActive', { isActive });
      } else {
        queryBuilder.where('notice.isActive = :isActive', { isActive });
      }
    }

    return queryBuilder
      .orderBy('notice.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Notice> {
    const notice = await this.noticeRepository.findOne({
      where: { id },
    });

    if (!notice) {
      throw new NotFoundException(`Notice with ID ${id} not found`);
    }

    // 조회수 증가
    notice.viewCount += 1;
    await this.noticeRepository.save(notice);

    return notice;
  }

  async update(id: string, updateNoticeDto: UpdateNoticeDto): Promise<Notice> {
    const notice = await this.findOne(id);

    Object.assign(notice, updateNoticeDto);

    return this.noticeRepository.save(notice);
  }

  async remove(id: string): Promise<void> {
    const notice = await this.findOne(id);
    await this.noticeRepository.remove(notice);
  }

  async findLatest(type?: NoticeType, limit: number = 10): Promise<Notice[]> {
    const queryBuilder = this.noticeRepository.createQueryBuilder('notice')
      .where('notice.isActive = :isActive', { isActive: true });

    if (type) {
      queryBuilder.andWhere('notice.type = :type', { type });
    }

    return queryBuilder
      .orderBy('notice.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }
}
