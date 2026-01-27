import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly sendGridApiKey: string;
  private readonly sendGridFromEmail: string;
  private readonly sendGridApiUrl = 'https://api.sendgrid.com/v3/mail/send';

  constructor(private readonly configService: ConfigService) {
    this.sendGridApiKey = this.configService.get<string>('SENDGRID_API_KEY') || '';
    this.sendGridFromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL') || 'noreply@gigmarket.ph';
    
    if (!this.sendGridApiKey) {
      this.logger.warn('SENDGRID_API_KEY is not set. Email sending will fail.');
    }
  }

  /**
   * 이메일 인증 링크를 이메일로 전송
   * @param email 수신자 이메일
   * @param verificationToken 인증 토큰
   * @returns 전송 결과
   */
  async sendVerificationEmail(email: string, verificationToken: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      if (!this.sendGridApiKey) {
        this.logger.error('SENDGRID_API_KEY is not configured');
        throw new Error('Email service is not configured');
      }

      const verificationUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173')}/verify-email?token=${verificationToken}`;

      const emailData = {
        personalizations: [
          {
            to: [{ email }],
            subject: 'Verify your Gig-Market email address',
          },
        ],
        from: { email: this.sendGridFromEmail, name: 'Gig-Market' },
        content: [
          {
            type: 'text/html',
            value: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                  .content { padding: 20px; background-color: #f9f9f9; }
                  .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                  .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Gig-Market Email Verification</h1>
                  </div>
                  <div class="content">
                    <p>Hello,</p>
                    <p>Thank you for registering with Gig-Market. Please verify your email address by clicking the button below:</p>
                    <p style="text-align: center;">
                      <a href="${verificationUrl}" class="button">Verify Email Address</a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #4CAF50;">${verificationUrl}</p>
                    <p>This link will expire in 24 hours.</p>
                    <p>If you did not create an account with Gig-Market, please ignore this email.</p>
                  </div>
                  <div class="footer">
                    <p>&copy; 2025 Gig-Market. All rights reserved.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          },
        ],
      };

      const response = await axios.post(this.sendGridApiUrl, emailData, {
        headers: {
          Authorization: `Bearer ${this.sendGridApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      this.logger.log(`Verification email sent successfully to ${email}`);

      return {
        success: true,
        messageId: response.headers['x-message-id'] || 'sent',
      };
    } catch (error) {
      const errorDetails = error.response?.data || error.message;
      this.logger.error('SendGrid Email Error:', JSON.stringify(errorDetails, null, 2));
      this.logger.error('SendGrid Error Status:', error.response?.status);
      this.logger.error('SendGrid Error Headers:', error.response?.headers);
      
      // 이메일 전송 실패는 치명적이지 않으므로 로그만 남기고 계속 진행
      // (사용자는 나중에 재전송 요청 가능)
      this.logger.warn(`Failed to send verification email to ${email}. Error: ${error.message}`);
      this.logger.warn(`[EMAIL NOT SENT] Verification token for ${email}: ${verificationToken}`);
      
      // 개발/프로덕션 모두에서 에러를 던지지 않고 계속 진행
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
