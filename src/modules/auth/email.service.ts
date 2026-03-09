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
    this.sendGridApiKey = (this.configService.get<string>('SENDGRID_API_KEY') || '').trim();
    this.sendGridFromEmail = (this.configService.get<string>('SENDGRID_FROM_EMAIL') || 'noreply@gigmarket.ph').trim();

    if (!this.sendGridApiKey) {
      this.logger.warn('SENDGRID_API_KEY is not set. Email sending will fail.');
    }
    if (!this.sendGridFromEmail) {
      this.logger.warn('SENDGRID_FROM_EMAIL is not set. Using default.');
      this.sendGridFromEmail = 'noreply@gigmarket.ph';
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

      // register/verify-otp와 동일하게 백엔드(3000) 사용. 클릭 시 GET /verify-email?token=... → 검증 후 프론트로 리다이렉트
      const backendPublicUrl = (this.configService.get<string>('BACKEND_PUBLIC_URL') || 'http://localhost:3000').replace(/\/$/, '');
      const verificationUrl = `${backendPublicUrl}/verify-email?token=${verificationToken}`;

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
    } catch (error: any) {
      const errMsg = error?.message ?? String(error);
      const errorDetails = error?.response?.data ?? errMsg;
      const status = error?.response?.status;
      this.logger.error('SendGrid Email Error:', JSON.stringify(errorDetails, null, 2));
      if (status != null) this.logger.error('SendGrid Error Status:', status);
      if (error?.response?.headers) this.logger.error('SendGrid Error Headers:', error.response.headers);

      this.logger.warn(`Failed to send verification email to ${email}. Error: ${errMsg}`);
      this.logger.warn(`[EMAIL NOT SENT] Verification token for ${email}: ${verificationToken}`);

      return {
        success: false,
        error: errMsg,
      };
    }
  }

  /**
   * OTP 코드를 이메일로 전송 (비밀번호 찾기 등)
   */
  async sendOtpEmail(to: string, otpCode: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.sendGridApiKey) {
        this.logger.error('SENDGRID_API_KEY is not configured');
        return { success: false, error: 'Email service not configured' };
      }
      const emailData = {
        personalizations: [{ to: [{ email: to }], subject: 'Gig-Market OTP Verification Code' }],
        from: { email: this.sendGridFromEmail, name: 'Gig-Market' },
        content: [{
          type: 'text/html',
          value: `<p>Your OTP code is: <strong>${otpCode}</strong></p><p>Valid for 5 minutes. If you did not request this, please ignore.</p>`,
        }],
      };
      await axios.post(this.sendGridApiUrl, emailData, {
        headers: { Authorization: `Bearer ${this.sendGridApiKey}`, 'Content-Type': 'application/json' },
      });
      this.logger.log(`OTP email sent to ${to}`);
      return { success: true };
    } catch (error: any) {
      this.logger.error('SendGrid OTP Email Error:', error?.response?.data || error?.message);
      return { success: false, error: error?.message ?? String(error) };
    }
  }

  /**
   * 시험용 이메일 전송 (관리자 대시보드 등에서 사용)
   * @param to 수신자 이메일
   * @returns 전송 결과
   */
  async sendTestEmail(to: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      if (!this.sendGridApiKey) {
        this.logger.error('SENDGRID_API_KEY is not configured');
        throw new Error('Email service is not configured');
      }

      const emailData = {
        personalizations: [
          {
            to: [{ email: to }],
            subject: '[Gig-Market] Test Email',
          },
        ],
        from: { email: this.sendGridFromEmail, name: 'Gig-Market' },
        content: [
          {
            type: 'text/html',
            value: `
              <!DOCTYPE html>
              <html>
              <head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;}.container{max-width:600px;margin:0 auto;padding:20px;}.header{background:#4CAF50;color:white;padding:20px;text-align:center;}.content{padding:20px;background:#f9f9f9;}</style></head>
              <body>
                <div class="container">
                  <div class="header"><h1>Gig-Market Test Email</h1></div>
                  <div class="content">
                    <p>Hello,</p>
                    <p>This is a <strong>test email</strong> for SendGrid integration.</p>
                    <p>If you received this email, the email sending configuration is working correctly.</p>
                    <p>Sent at: ${new Date().toISOString()}</p>
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

      this.logger.log(`Test email sent successfully to ${to}`);
      return {
        success: true,
        messageId: response.headers['x-message-id'] || 'sent',
      };
    } catch (error: any) {
      const errMsg = error?.message ?? String(error);
      const errorDetails = error?.response?.data ?? errMsg;
      const status = error?.response?.status;
      this.logger.error('SendGrid Test Email Error:', JSON.stringify(errorDetails, null, 2));
      if (status != null) this.logger.error('SendGrid Error Status:', status);
      this.logger.warn(`Failed to send test email to ${to}. Error: ${errMsg}`);
      return {
        success: false,
        error: errMsg,
      };
    }
  }
}
