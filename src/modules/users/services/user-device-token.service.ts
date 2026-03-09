import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDeviceToken, AppMode, DevicePlatform } from '../entities/user-device-token.entity';

@Injectable()
export class UserDeviceTokenService {
  constructor(
    @InjectRepository(UserDeviceToken)
    private readonly deviceTokenRepository: Repository<UserDeviceToken>,
  ) {}

  /**
   * 디바이스 토큰 등록 또는 업데이트.
   * (userId, appMode, platform) 조합당 최대 1행 유지: 이미 있으면 해당 행의 fcm_token만 갱신하고
   * 같은 조합의 다른 행은 삭제. 없으면 새로 생성.
   */
  async registerDeviceToken(
    userId: string,
    fcmToken: string,
    appMode: AppMode,
    platform: DevicePlatform,
    deviceId?: string,
  ): Promise<UserDeviceToken> {
    const existingSameCombo = await this.deviceTokenRepository.findOne({
      where: { userId, appMode, platform },
    });

    if (existingSameCombo) {
      existingSameCombo.fcmToken = fcmToken;
      existingSameCombo.deviceId = deviceId;
      existingSameCombo.isActive = true;
      existingSameCombo.lastUsedAt = new Date();
      const saved = await this.deviceTokenRepository.save(existingSameCombo);
      // 같은 (userId, appMode, platform)인 다른 행만 삭제 (중복 제거, 현재 행은 유지)
      await this.deviceTokenRepository
        .createQueryBuilder()
        .delete()
        .where('user_id = :userId', { userId })
        .andWhere('app_mode = :appMode', { appMode })
        .andWhere('platform = :platform', { platform })
        .andWhere('id != :id', { id: saved.id })
        .execute();
      return saved;
    }

    // 같은 fcmToken이 다른 사용자/조합으로 있으면 해당 행 업데이트
    const existingByToken = await this.deviceTokenRepository.findOne({
      where: { fcmToken },
    });
    if (existingByToken) {
      existingByToken.userId = userId;
      existingByToken.appMode = appMode;
      existingByToken.platform = platform;
      existingByToken.deviceId = deviceId;
      existingByToken.isActive = true;
      existingByToken.lastUsedAt = new Date();
      return this.deviceTokenRepository.save(existingByToken);
    }

    const deviceToken = this.deviceTokenRepository.create({
      userId,
      fcmToken,
      appMode,
      platform,
      deviceId,
      isActive: true,
      lastUsedAt: new Date(),
    });
    return this.deviceTokenRepository.save(deviceToken);
  }

  /**
   * 사용자의 활성화된 디바이스 토큰 조회
   * @param userId 사용자 ID
   * @param appMode 앱 모드 (선택사항, 없으면 모든 모드)
   * @returns 활성화된 디바이스 토큰 배열
   */
  async getActiveTokens(
    userId: string,
    appMode?: AppMode,
  ): Promise<string[]> {
    const where: any = {
      userId,
      isActive: true,
    };

    if (appMode) {
      where.appMode = appMode;
    }

    const tokens = await this.deviceTokenRepository.find({
      where,
      select: ['fcmToken'],
      order: { lastUsedAt: 'DESC' },
    });

    return tokens.map((t) => t.fcmToken);
  }

  /**
   * 같은 user_id에 토큰이 여러 개일 때 last_used_at 기준 최신 활성 토큰 1개 반환.
   * @param appMode 없으면 모든 모드 중 최신 1개
   */
  async getLatestActiveToken(userId: string, appMode?: AppMode): Promise<string | null> {
    const where: Record<string, unknown> = { userId, isActive: true };
    if (appMode) where.appMode = appMode;
    const row = await this.deviceTokenRepository.findOne({
      where,
      select: ['fcmToken'],
      order: { lastUsedAt: 'DESC' },
    });
    return row?.fcmToken?.trim() ? row.fcmToken : null;
  }

  /**
   * 특정 앱 모드의 활성화된 디바이스 토큰 조회
   */
  async getTokensByAppMode(
    userId: string,
    appMode: AppMode,
  ): Promise<string[]> {
    return this.getActiveTokens(userId, appMode);
  }

  /**
   * 디바이스 토큰 제거
   */
  async removeDeviceToken(userId: string, fcmToken: string): Promise<void> {
    await this.deviceTokenRepository.delete({
      userId,
      fcmToken,
    });
  }

  /**
   * 유효하지 않은 토큰 비활성화
   */
  async deactivateToken(fcmToken: string): Promise<void> {
    await this.deviceTokenRepository.update(
      { fcmToken },
      { isActive: false },
    );
  }

  /**
   * 사용자의 모든 디바이스 토큰 조회 (상세 정보 포함)
   */
  async getDeviceTokens(userId: string): Promise<UserDeviceToken[]> {
    return this.deviceTokenRepository.find({
      where: { userId, isActive: true },
      order: { lastUsedAt: 'DESC' },
    });
  }

  /**
   * 전체 활성 FCM 토큰 조회 (전체 공지 등 브로드캐스트용)
   */
  async getAllActiveFcmTokens(): Promise<string[]> {
    const tokens = await this.deviceTokenRepository.find({
      where: { isActive: true },
      select: ['fcmToken'],
    });
    return tokens.map((t) => t.fcmToken).filter((t) => t && t.trim().length > 0);
  }
}
