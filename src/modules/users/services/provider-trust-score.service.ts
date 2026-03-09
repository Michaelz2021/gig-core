import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Provider } from '../entities/provider.entity';
import { User } from '../entities/user.entity';
import { ProviderTrustScore } from '../entities/provider-trust-score.entity';
import { UserType } from '../entities/user.entity';
import { BusinessType } from '../entities/provider.entity';

@Injectable()
export class ProviderTrustScoreService {
  constructor(
    @InjectRepository(ProviderTrustScore)
    private readonly repo: Repository<ProviderTrustScore>,
    @InjectRepository(Provider)
    private readonly providerRepo: Repository<Provider>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * P1 Identity score (max 150): email 10, phone 15, gov id 50, address 25, business type 10, tin (company) 40.
   */
  private async calculateP1(providerId: string): Promise<number> {
    const provider = await this.providerRepo.findOne({
      where: { id: providerId },
      relations: ['user'],
    });
    if (!provider?.user) return 0;
    const user = provider.user as User;
    let score = 0;
    if (user.isEmailVerified) score += 10;
    if (user.isPhoneVerified) score += 15;
    if (
      (provider.governmentIdType && provider.governmentIdNumber) ||
      user.isIdVerified
    ) {
      score += 50;
    }
    // 1.4 address: no business_address column in entity, skip or 0
    if (provider.businessType) score += 10;
    if (
      provider.businessType === BusinessType.COMPANY &&
      provider.tinNumber
    ) {
      score += 40;
    }
    return Math.min(score, 150);
  }

  async recalculateForProvider(providerId: string): Promise<ProviderTrustScore> {
    const provider = await this.providerRepo.findOne({
      where: { id: providerId },
    });
    if (!provider) throw new Error(`Provider ${providerId} not found`);
    const p1 = await this.calculateP1(providerId);
    const providerType =
      provider.businessType === BusinessType.COMPANY ? 'company' : 'individual';
    let row = await this.repo.findOne({ where: { providerId } });
    if (!row) {
      row = this.repo.create({
        providerId,
        providerType,
        p1IdentityScore: p1,
        lastCalculatedAt: new Date(),
      });
    } else {
      row.p1IdentityScore = p1;
      row.providerType = providerType;
      row.lastCalculatedAt = new Date();
    }
    return this.repo.save(row);
  }

  async recalculateByUserId(userId: string): Promise<void> {
    const provider = await this.providerRepo.findOne({
      where: { userId },
    });
    if (provider) await this.recalculateForProvider(provider.id);
  }

  async recalculateAllProviders(): Promise<{ updated: number; errors?: string[] }> {
    const users = await this.userRepo.find({
      where: [{ userType: UserType.PROVIDER }, { userType: UserType.BOTH }],
      select: ['id'],
    });
    const providerIds = await this.providerRepo
      .createQueryBuilder('p')
      .select('p.id')
      .where('p.user_id IN (:...ids)', {
        ids: users.map((u) => u.id),
      })
      .getMany();
    const ids = providerIds.map((p) => p.id);
    const errors: string[] = [];
    let updated = 0;
    for (const id of ids) {
      try {
        await this.recalculateForProvider(id);
        updated++;
      } catch (e: any) {
        errors.push(`${id}: ${e?.message ?? e}`);
      }
    }
    return { updated, errors: errors.length ? errors : undefined };
  }
}
