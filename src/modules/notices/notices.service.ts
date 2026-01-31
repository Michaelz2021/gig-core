import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notice, NoticeType } from './entities/notice.entity';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { UserDeviceTokenService } from '../users/services/user-device-token.service';
import { FcmService } from '../notifications/fcm.service';

@Injectable()
export class NoticesService {
  private readonly logger = new Logger(NoticesService.name);

  constructor(
    @InjectRepository(Notice)
    private readonly noticeRepository: Repository<Notice>,
    private readonly userDeviceTokenService: UserDeviceTokenService,
    private readonly fcmService: FcmService,
  ) {}

  async create(createNoticeDto: CreateNoticeDto, createdBy?: string): Promise<Notice> {
    const notice = this.noticeRepository.create({
      ...createNoticeDto,
      createdBy,
      publishedAt: createNoticeDto.publishedAt || new Date(),
    });

    const saved = await this.noticeRepository.save(notice);

    // 저장 직후 DB에서 재조회하여 실제 반영 여부 확인 (다른 DB/연결 이슈 조기 발견)
    const found = await this.noticeRepository.findOne({ where: { id: saved.id } });
    if (!found) {
      throw new InternalServerErrorException(
        'Notice was created but could not be read back from the database. Check that the notices table exists and the app uses the same DB you are querying.',
      );
    }

    // 전체 공지: user_device_tokens 의 모든 활성 FCM 토큰으로 푸시 발송 (비동기, 실패해도 공지 생성은 성공)
    this.sendNoticePushToAllDevices(found).catch((err) => {
      this.logger.warn('Failed to send notice push to devices', err);
    });

    return found;
  }

  /**
   * 공지 생성 시 등록된 모든 디바이스( user_device_tokens )에 FCM 푸시 발송
   */
  private async sendNoticePushToAllDevices(notice: Notice): Promise<void> {
    const tokens = await this.userDeviceTokenService.getAllActiveFcmTokens();
    if (tokens.length === 0) {
      this.logger.log('No active FCM tokens for notice broadcast');
      return;
    }

    const contentTrimmed = notice.content?.trim() ?? '';
    const body = notice.summary?.trim()
      ? notice.summary
      : contentTrimmed.slice(0, 200) + (contentTrimmed.length > 200 ? '...' : '') || '새 공지가 등록되었습니다.';

    const result = await this.fcmService.sendPushNotification(tokens, {
      title: notice.title || '공지사항',
      body: body || '새 공지가 등록되었습니다.',
      data: {
        type: 'notice',
        noticeId: notice.id,
      },
      imageUrl: notice.images?.[0],
    });

    this.logger.log(
      `Notice push broadcast: noticeId=${notice.id}, tokens=${tokens.length}, success=${result.success}, failure=${result.failure}`,
    );
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
