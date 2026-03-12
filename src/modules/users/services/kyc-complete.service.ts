import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Provider } from '../entities/provider.entity';
import { KYCLevel } from '../entities/user.entity';
import { KycCompleteDto } from '../dto/kyc-complete.dto';

const KYC_LEVEL_MAP: Record<number, KYCLevel> = {
  1: KYCLevel.BASIC,
  2: KYCLevel.INTERMEDIATE,
  3: KYCLevel.ADVANCED,
};

@Injectable()
export class KycCompleteService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Provider)
    private readonly providerRepository: Repository<Provider>,
  ) {}

  /**
   * Process KYC completion webhook/callback: update users and providers.
   * - result approved → users.is_id_verified=true, else false
   * - id_type → providers.government_id_type
   * - verification_service_request_id → providers.government_id_number
   * - ai_confidence_score → users.ai_confidence_score
   * - kyc_level_granted → users.kyc_level (1=BASIC, 2=INTERMEDIATE, 3=ADVANCED)
   * - details → users.kyc_detail
   */
  async processKycComplete(userId: string, dto: KycCompleteDto) {
    const provider = await this.providerRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!provider) {
      throw new ForbiddenException('Provider profile not found. Only providers can complete KYC.');
    }

    const user = provider.user ?? (await this.userRepository.findOne({ where: { id: userId } }));
    if (!user) {
      throw new ForbiddenException('User not found.');
    }

    const isIdVerified = dto.result === 'approved';
    const kycLevel = KYC_LEVEL_MAP[dto.kyc_level_granted] ?? KYCLevel.BASIC;

    await this.userRepository.update(user.id, {
      isIdVerified,
      kycLevel,
      ...(dto.ai_confidence_score != null && { aiConfidenceScore: dto.ai_confidence_score }),
      ...(dto.details != null && { kycDetail: dto.details as Record<string, unknown> }),
    });

    await this.providerRepository.update(provider.id, {
      governmentIdType: dto.id_type ?? null,
      governmentIdNumber: dto.verification_service_request_id ?? null,
    });

    return {
      success: true,
      message: 'KYC completion recorded',
      data: {
        user_id: user.id,
        is_id_verified: isIdVerified,
        kyc_level: kycLevel,
        ai_confidence_score: dto.ai_confidence_score ?? null,
      },
    };
  }
}
