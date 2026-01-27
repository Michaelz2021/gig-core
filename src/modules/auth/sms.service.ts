import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PhoneValidator } from '../../common/utils/phone-validator';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly semaphoreApiKey: string;
  private readonly semaphoreApiUrl = 'https://api.semaphore.co/api/v4/messages';

  constructor(private readonly configService: ConfigService) {
    this.semaphoreApiKey = this.configService.get<string>('SEMAPHORE_API_KEY') || '';
    
    if (!this.semaphoreApiKey) {
      this.logger.warn('SEMAPHORE_API_KEY is not set. SMS sending will fail.');
    }
  }

  /**
   * OTP를 SMS로 전송
   * @param mobileNumber 전화번호 (필리핀 모바일 번호)
   * @param otpCode OTP 코드
   * @returns 전송 결과
   */
  async sendOTP(mobileNumber: string, otpCode: string): Promise<{
    success: boolean;
    messageId?: string;
    status?: string;
    error?: string;
  }> {
    try {
      // 전화번호 검증
      if (!PhoneValidator.isValidPhilippineMobile(mobileNumber)) {
        throw new Error('Invalid Philippine mobile number format');
      }

      // Semaphore API 형식으로 정규화
      const normalizedNumber = PhoneValidator.normalizeForSemaphore(mobileNumber);

      if (!this.semaphoreApiKey) {
        this.logger.error('SEMAPHORE_API_KEY is not configured');
        throw new Error('SMS service is not configured');
      }

      const response = await axios.post(this.semaphoreApiUrl, {
        apikey: this.semaphoreApiKey,
        number: normalizedNumber,
        message: `Your Gig-Market verification code is: ${otpCode}. Valid for 5 minutes. Do not share this code.`,
        sendername: 'GigMarket', // 11 characters max
      });

      this.logger.log(`OTP sent successfully to ${normalizedNumber}`);

      return {
        success: true,
        messageId: response.data.message_id,
        status: response.data.status,
      };
    } catch (error) {
      this.logger.error('Semaphore SMS Error:', error.response?.data || error.message);
      
      // 개발 환경에서는 에러를 던지지 않고 로그만 남김
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(`[DEV MODE] Would send OTP ${otpCode} to ${mobileNumber}`);
        return {
          success: true,
          messageId: 'dev-mode-message-id',
          status: 'sent',
        };
      }

      throw error;
    }
  }
}
