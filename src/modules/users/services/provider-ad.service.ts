import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProviderAd } from '../entities/provider-ad.entity';
import { Provider } from '../entities/provider.entity';
import { CreateProviderAdDto } from '../dto/create-provider-ad.dto';
import { UpdateProviderAdDto } from '../dto/update-provider-ad.dto';

@Injectable()
export class ProviderAdService {
  constructor(
    @InjectRepository(ProviderAd)
    private readonly providerAdRepository: Repository<ProviderAd>,
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
  ) {}

  /**
   * ProviderAd 생성
   */
  async create(createProviderAdDto: CreateProviderAdDto): Promise<ProviderAd> {
    // Provider 존재 확인
    const provider = await this.providerRepository.findOne({
      where: { id: createProviderAdDto.providerId },
    });

    if (!provider) {
      throw new NotFoundException(`Provider with ID ${createProviderAdDto.providerId} not found`);
    }

    // 날짜 변환
    const ad = this.providerAdRepository.create({
      providerId: createProviderAdDto.providerId,
      backgroundImageUrl: createProviderAdDto.backgroundImageUrl,
      providerName: createProviderAdDto.providerName,
      serviceArea: createProviderAdDto.serviceArea,
      serviceCategories: createProviderAdDto.serviceCategories || [],
      promoMessage: createProviderAdDto.promoMessage,
      promoTitle: createProviderAdDto.promoTitle,
      hasDiscount: createProviderAdDto.hasDiscount || false,
      discountPercentage: createProviderAdDto.discountPercentage,
      discountAmount: createProviderAdDto.discountAmount,
      discountDescription: createProviderAdDto.discountDescription,
      discountStartDate: createProviderAdDto.discountStartDate
        ? new Date(createProviderAdDto.discountStartDate)
        : null,
      discountEndDate: createProviderAdDto.discountEndDate
        ? new Date(createProviderAdDto.discountEndDate)
        : null,
      startDate: createProviderAdDto.startDate ? new Date(createProviderAdDto.startDate) : null,
      endDate: createProviderAdDto.endDate ? new Date(createProviderAdDto.endDate) : null,
      actionUrl: createProviderAdDto.actionUrl,
      actionText: createProviderAdDto.actionText || 'Learn More',
      priority: createProviderAdDto.priority || 0,
      isActive: createProviderAdDto.isActive !== undefined ? createProviderAdDto.isActive : true,
    });

    return await this.providerAdRepository.save(ad);
  }

  /**
   * 활성화된 ProviderAd 목록 조회 (노출 기간 내, 우선순위 순)
   */
  async findAll(): Promise<{ items: ProviderAd[]; totalCount: number }> {
    const now = new Date();

    // 활성화된 모든 광고 조회
    const allItems = await this.providerAdRepository.find({
      where: { isActive: true },
      relations: ['provider'],
      order: {
        priority: 'DESC',
        createdAt: 'DESC',
      },
    });

    // 현재 날짜 기준으로 노출 기간 내인 것만 필터링
    const filteredItems = allItems.filter((ad) => {
      // 시작일이 설정되어 있고 아직 시작 전이면 제외
      if (ad.startDate && ad.startDate > now) return false;
      // 종료일이 설정되어 있고 이미 종료되었으면 제외
      if (ad.endDate && ad.endDate < now) return false;
      return true;
    });

    return {
      items: filteredItems,
      totalCount: filteredItems.length,
    };
  }

  /**
   * ID로 ProviderAd 조회
   */
  async findOne(id: string): Promise<ProviderAd> {
    const ad = await this.providerAdRepository.findOne({
      where: { id },
      relations: ['provider'],
    });

    if (!ad) {
      throw new NotFoundException(`ProviderAd with ID ${id} not found`);
    }

    return ad;
  }

  /**
   * Provider ID로 ProviderAd 목록 조회
   */
  async findByProviderId(providerId: string): Promise<ProviderAd[]> {
    return await this.providerAdRepository.find({
      where: { providerId },
      relations: ['provider'],
      order: {
        priority: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  /**
   * ProviderAd 수정
   */
  async update(id: string, updateProviderAdDto: UpdateProviderAdDto): Promise<ProviderAd> {
    const ad = await this.findOne(id);

    if (updateProviderAdDto.providerId != null) {
      const provider = await this.providerRepository.findOne({
        where: { id: updateProviderAdDto.providerId },
      });
      if (!provider) {
        throw new NotFoundException(`Provider with ID ${updateProviderAdDto.providerId} not found`);
      }
      ad.providerId = updateProviderAdDto.providerId;
    }
    if (updateProviderAdDto.backgroundImageUrl !== undefined) ad.backgroundImageUrl = updateProviderAdDto.backgroundImageUrl;
    if (updateProviderAdDto.providerName !== undefined) ad.providerName = updateProviderAdDto.providerName;
    if (updateProviderAdDto.serviceArea !== undefined) ad.serviceArea = updateProviderAdDto.serviceArea;
    if (updateProviderAdDto.serviceCategories !== undefined) ad.serviceCategories = updateProviderAdDto.serviceCategories;
    if (updateProviderAdDto.promoMessage !== undefined) ad.promoMessage = updateProviderAdDto.promoMessage;
    if (updateProviderAdDto.promoTitle !== undefined) ad.promoTitle = updateProviderAdDto.promoTitle;
    if (updateProviderAdDto.hasDiscount !== undefined) ad.hasDiscount = updateProviderAdDto.hasDiscount;
    if (updateProviderAdDto.discountPercentage !== undefined) ad.discountPercentage = updateProviderAdDto.discountPercentage;
    if (updateProviderAdDto.discountAmount !== undefined) ad.discountAmount = updateProviderAdDto.discountAmount;
    if (updateProviderAdDto.discountDescription !== undefined) ad.discountDescription = updateProviderAdDto.discountDescription;
    if (updateProviderAdDto.discountStartDate !== undefined) {
      ad.discountStartDate = updateProviderAdDto.discountStartDate ? new Date(updateProviderAdDto.discountStartDate) : null;
    }
    if (updateProviderAdDto.discountEndDate !== undefined) {
      ad.discountEndDate = updateProviderAdDto.discountEndDate ? new Date(updateProviderAdDto.discountEndDate) : null;
    }
    if (updateProviderAdDto.startDate !== undefined) {
      ad.startDate = updateProviderAdDto.startDate ? new Date(updateProviderAdDto.startDate) : null;
    }
    if (updateProviderAdDto.endDate !== undefined) {
      ad.endDate = updateProviderAdDto.endDate ? new Date(updateProviderAdDto.endDate) : null;
    }
    if (updateProviderAdDto.actionUrl !== undefined) ad.actionUrl = updateProviderAdDto.actionUrl;
    if (updateProviderAdDto.actionText !== undefined) ad.actionText = updateProviderAdDto.actionText;
    if (updateProviderAdDto.priority !== undefined) ad.priority = updateProviderAdDto.priority;
    if (updateProviderAdDto.isActive !== undefined) ad.isActive = updateProviderAdDto.isActive;

    return await this.providerAdRepository.save(ad);
  }

  /**
   * ProviderAd 삭제
   */
  async remove(id: string): Promise<{ deleted: true; id: string }> {
    const ad = await this.findOne(id);
    await this.providerAdRepository.remove(ad);
    return { deleted: true, id };
  }
}

