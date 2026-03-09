import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsumerProviderFavorite } from './entities/consumer-provider-favorite.entity';
import { ConsumerProviderReaction, ReactionType } from './entities/consumer-provider-reaction.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class ConsumerProviderService {
  constructor(
    @InjectRepository(ConsumerProviderFavorite)
    private readonly favoriteRepo: Repository<ConsumerProviderFavorite>,
    @InjectRepository(ConsumerProviderReaction)
    private readonly reactionRepo: Repository<ConsumerProviderReaction>,
    private readonly usersService: UsersService,
  ) {}

  private async providerIdToUserId(providerId: string): Promise<string> {
    const userId = await this.usersService.getUserIdByProviderId(providerId);
    if (!userId) throw new NotFoundException('Provider not found');
    return userId;
  }

  async addFavorite(consumerId: string, providerId: string): Promise<ConsumerProviderFavorite> {
    const providerUserId = await this.providerIdToUserId(providerId);
    const existing = await this.favoriteRepo.findOne({ where: { consumerId, providerId: providerUserId } });
    if (existing) throw new ConflictException('Already in favorites');
    const fav = this.favoriteRepo.create({ consumerId, providerId: providerUserId });
    return this.favoriteRepo.save(fav);
  }

  async removeFavorite(consumerId: string, providerId: string): Promise<void> {
    const providerUserId = await this.providerIdToUserId(providerId);
    await this.favoriteRepo.delete({ consumerId, providerId: providerUserId });
  }

  async getFavorites(consumerId: string): Promise<{ items: any[]; total: number }> {
    const [items, total] = await this.favoriteRepo.findAndCount({
      where: { consumerId },
      order: { createdAt: 'DESC' },
    });
    const providerUserIds = items.map((i) => i.providerId);
    const providerIdMap = await this.usersService.getProviderIdsByUserIds(providerUserIds);
    const list = items.map((i) => ({
      id: i.id,
      providerId: providerIdMap[i.providerId] ?? i.providerId,
      createdAt: i.createdAt,
    }));
    return { items: list, total };
  }

  async checkFavorite(consumerId: string, providerId: string): Promise<{ isFavorite: boolean }> {
    const providerUserId = await this.providerIdToUserId(providerId);
    const found = await this.favoriteRepo.findOne({ where: { consumerId, providerId: providerUserId } });
    return { isFavorite: !!found };
  }

  async addReaction(consumerId: string, providerId: string, reaction: ReactionType, dto?: { note?: string; bookingId?: string; isPublic?: boolean }): Promise<ConsumerProviderReaction> {
    const providerUserId = await this.providerIdToUserId(providerId);
    const existing = await this.reactionRepo.findOne({ where: { consumerId, providerId: providerUserId, reaction } });
    if (existing) throw new ConflictException(`Already ${reaction}d`);
    const r = this.reactionRepo.create({
      consumerId,
      providerId: providerUserId,
      reaction,
      note: dto?.note ?? null,
      bookingId: dto?.bookingId ?? null,
      isPublic: dto?.isPublic ?? true,
    });
    return this.reactionRepo.save(r);
  }

  async removeReaction(consumerId: string, providerId: string, reaction: ReactionType): Promise<void> {
    const providerUserId = await this.providerIdToUserId(providerId);
    await this.reactionRepo.delete({ consumerId, providerId: providerUserId, reaction });
  }

  async getMyReactions(consumerId: string, reaction: ReactionType): Promise<{ items: any[]; total: number }> {
    const [items, total] = await this.reactionRepo.findAndCount({
      where: { consumerId, reaction },
      order: { createdAt: 'DESC' },
    });
    const providerUserIds = items.map((i) => i.providerId);
    const providerIdMap = await this.usersService.getProviderIdsByUserIds(providerUserIds);
    const list = items.map((i) => ({
      id: i.id,
      providerId: providerIdMap[i.providerId] ?? i.providerId,
      note: i.note,
      isPublic: i.isPublic,
      createdAt: i.createdAt,
    }));
    return { items: list, total };
  }

  async getStats(providerId: string): Promise<{ favoriteCount: number; likeCount: number; recommendCount: number }> {
    const providerUserId = await this.providerIdToUserId(providerId);
    const [favCount, likeCount, recCount] = await Promise.all([
      this.favoriteRepo.count({ where: { providerId: providerUserId } }),
      this.reactionRepo.count({ where: { providerId: providerUserId, reaction: 'like' } }),
      this.reactionRepo.count({ where: { providerId: providerUserId, reaction: 'recommend' } }),
    ]);
    return { favoriteCount: favCount, likeCount, recommendCount: recCount };
  }

  async getMyState(consumerId: string, providerId: string): Promise<{ isFavorite: boolean; isLike: boolean; isRecommend: boolean }> {
    const providerUserId = await this.providerIdToUserId(providerId);
    const [fav, like, rec] = await Promise.all([
      this.favoriteRepo.findOne({ where: { consumerId, providerId: providerUserId } }),
      this.reactionRepo.findOne({ where: { consumerId, providerId: providerUserId, reaction: 'like' } }),
      this.reactionRepo.findOne({ where: { consumerId, providerId: providerUserId, reaction: 'recommend' } }),
    ]);
    return { isFavorite: !!fav, isLike: !!like, isRecommend: !!rec };
  }
}
