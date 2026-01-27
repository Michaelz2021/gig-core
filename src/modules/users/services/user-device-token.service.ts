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
   * 디바이스 토큰 등록 또는 업데이트
   * 같은 fcmToken이 이미 있으면 업데이트, 없으면 새로 생성
   */
  async registerDeviceToken(
    userId: string,
    fcmToken: string,
    appMode: AppMode,
    platform: DevicePlatform,
    deviceId?: string,
  ): Promise<UserDeviceToken> {
    // 같은 fcmToken이 이미 있는지 확인
    const existing = await this.deviceTokenRepository.findOne({
      where: { fcmToken },
    });

    if (existing) {
      // 기존 토큰 업데이트 (userId, appMode, platform 등)
      existing.userId = userId;
      existing.appMode = appMode;
      existing.platform = platform;
      existing.deviceId = deviceId;
      existing.isActive = true;
      existing.lastUsedAt = new Date();
      return this.deviceTokenRepository.save(existing);
    }

    // 새 토큰 생성
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
    });

    return tokens.map((t) => t.fcmToken);
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
}
