import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PhoneValidator } from '../../common/utils/phone-validator';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly semaphoreApiKey: string;
  // OTP 전용 엔드포인트 사용
  private readonly semaphoreOtpUrl = 'https://api.semaphore.co/api/v4/otp';
  private readonly semaphoreMessagesUrl = 'https://api.semaphore.co/api/v4/messages';

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

      // OTP 전용 라우트: {otp} 플레이스홀더와 code 파라미터 사용
      const response = await axios.post(this.semaphoreOtpUrl, {
        apikey: this.semaphoreApiKey,
        number: normalizedNumber,
        message: 'Your One Time Password is: {otp}. Please use it within 5 minutes.',
        code: otpCode,
        sendername: 'GigMarket', // 11 characters max
      });

      this.logger.log(`OTP sent successfully to ${normalizedNumber}`);
      this.logger.debug(`Semaphore OTP response: ${JSON.stringify(response.data)}`);

      // 응답은 배열 또는 단일 객체일 수 있으므로 안전하게 파싱
      const data = Array.isArray(response.data) ? response.data[0] : response.data;

      return {
        success: true,
        messageId: data?.message_id,
        status: data?.status,
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

  /**
   * Send a general SMS message (e.g. business notifications). Max 160 chars per segment.
   */
  async sendMessage(mobileNumber: string, message: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!PhoneValidator.isValidPhilippineMobile(mobileNumber)) {
        return { success: false, error: 'Invalid Philippine mobile number format' };
      }
      const normalizedNumber = PhoneValidator.normalizeForSemaphore(mobileNumber);
      if (!this.semaphoreApiKey) {
        this.logger.error('SEMAPHORE_API_KEY is not configured');
        return { success: false, error: 'SMS service not configured' };
      }
      const text = String(message).slice(0, 160);
      await axios.post(this.semaphoreMessagesUrl, {
        apikey: this.semaphoreApiKey,
        number: normalizedNumber,
        message: text,
        sendername: 'GigMarket',
      });
      this.logger.log(`SMS sent to ${normalizedNumber}`);
      return { success: true };
    } catch (error: any) {
      this.logger.error('Semaphore SMS sendMessage Error:', error?.response?.data || error?.message);
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(`[DEV MODE] Would send SMS to ${mobileNumber}: ${message?.slice(0, 50)}...`);
        return { success: true };
      }
      return { success: false, error: error?.response?.data?.message || error?.message };
    }
  }
}
