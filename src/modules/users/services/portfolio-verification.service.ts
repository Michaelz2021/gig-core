import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider } from '../entities/provider.entity';
import { BusinessType } from '../entities/provider.entity';
import { PortfolioVerificationDto, mapAvailableDaysToNumbers } from '../dto/portfolio-verification.dto';

@Injectable()
export class PortfolioVerificationService {
  constructor(
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
  ) {}

  /**
   * Update provider from portfolio verification payload (POST /provider/verification/portfolio).
   */
  async submitPortfolio(userId: string, dto: PortfolioVerificationDto) {
    const provider = await this.providerRepository.findOne({ where: { userId } });
    if (!provider) {
      throw new ForbiddenException('Provider profile not found. Only providers can submit portfolio.');
    }

    const businessType =
      dto.businessType === 'company' ? BusinessType.COMPANY : BusinessType.INDIVIDUAL;

    const availableDays =
      dto.availableDays && dto.availableDays.length > 0
        ? mapAvailableDaysToNumbers(dto.availableDays)
        : undefined;

    if (dto.businessName !== undefined) provider.businessName = dto.businessName || null;
    provider.businessType = businessType;
    if (dto.vatable !== undefined) provider.vatable = dto.vatable;
    if (dto.businessAddress !== undefined) provider.businessAddress = dto.businessAddress ?? null;
    if (dto.tinNumber !== undefined) provider.tinNumber = dto.tinNumber || null;
    if (dto.yearsOfExperience !== undefined) provider.yearsOfExperience = dto.yearsOfExperience;
    if (dto.certifications !== undefined) provider.certifications = dto.certifications ?? null;
    if (dto.portfolioPhotos !== undefined) {
      provider.portfolioPhotos =
        dto.portfolioPhotos?.map((p) => ({
          url: p.url,
          caption: p.caption ?? '',
          uploadedAt: p.uploadedAt ?? new Date().toISOString(),
        })) ?? null;
    }
    if (dto.isAvailable !== undefined) provider.isAvailable = dto.isAvailable;
    if (availableDays !== undefined) provider.availableDays = availableDays;
    if (dto.availableHoursStart !== undefined)
      provider.availableHoursStart = dto.availableHoursStart || null;
    if (dto.availableHoursEnd !== undefined)
      provider.availableHoursEnd = dto.availableHoursEnd || null;
    if (dto.instantBookingEnabled !== undefined)
      provider.instantBookingEnabled = dto.instantBookingEnabled;
    if (dto.serviceRadiusKm !== undefined) provider.serviceRadiusKm = dto.serviceRadiusKm;
    if (dto.responseTimeMinutes !== undefined)
      provider.responseTimeMinutes = dto.responseTimeMinutes;
    if (dto.notificationPreferences !== undefined) {
      provider.notificationPreferences = {
        ...(provider.notificationPreferences || {}),
        ...dto.notificationPreferences,
      } as Provider['notificationPreferences'];
    }

    await this.providerRepository.save(provider);

    return {
      success: true,
      message: 'Portfolio verification submitted',
      data: { provider_id: provider.id },
    };
  }
}
