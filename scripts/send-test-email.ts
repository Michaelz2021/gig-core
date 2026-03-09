/**
 * 시험용 이메일 전송 스크립트
 * 사용: npx ts-node -r dotenv/config scripts/send-test-email.ts [수신이메일]
 * 기본 수신: michael2geron@gmail.com
 */
import axios from 'axios';
import * as path from 'path';
import * as dotenv from 'dotenv';

// .env 로드 (프로젝트 루트 기준)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';
const apiKey = (process.env.SENDGRID_API_KEY || '').trim();
const fromEmail = (process.env.SENDGRID_FROM_EMAIL || 'noreply@gigmarket.ph').trim();
const toEmail = process.argv[2] || 'michael2geron@gmail.com';

if (!apiKey) {
  console.error('SENDGRID_API_KEY가 .env에 없습니다.');
  process.exit(1);
}

const emailData = {
  personalizations: [
    {
      to: [{ email: toEmail }],
      subject: '[Gig-Market] 시험용 이메일 (Test Email)',
    },
  ],
  from: { email: fromEmail, name: 'Gig-Market' },
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
              <p>안녕하세요,</p>
              <p>This email is a test for <strong>SendGrid integration</strong>.</p>
              <p>If you receive this email, it means that the email sending configuration is working properly.</p>
              <p>Received time: ${new Date().toISOString()}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    },
  ],
};

async function main() {
  console.log('SendGrid 시험 발송 중...');
  console.log('수신:', toEmail);
  console.log('발신:', fromEmail);
  try {
    const response = await axios.post(SENDGRID_API_URL, emailData, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('발송 성공. Status:', response.status);
    console.log('x-message-id:', response.headers['x-message-id']);
  } catch (error: any) {
    console.error('발송 실패:', error.response?.status, error.response?.data || error.message);
    if (error.response?.data) console.error(JSON.stringify(error.response.data, null, 2));
    process.exit(1);
  }
}

main();
