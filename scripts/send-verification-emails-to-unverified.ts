/**
 * is_email_verified = false 인 사용자에게 verification email 일괄 발송
 * 사용: npx ts-node scripts/send-verification-emails-to-unverified.ts
 * (--dry-run: 발송 없이 대상만 출력)
 */
import { Client } from 'pg';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';
const sendGridApiKey = (process.env.SENDGRID_API_KEY || '').trim();
const sendGridFromEmail = (process.env.SENDGRID_FROM_EMAIL || 'noreply@gigmarket.ph').trim();
const backendPublicUrl = (process.env.BACKEND_PUBLIC_URL || 'http://localhost:3000').replace(/\/$/, '');
const jwtSecret = process.env.JWT_SECRET;
const dryRun = process.argv.includes('--dry-run');

interface UserRow {
  id: string;
  email: string;
}

function buildVerificationEmailHtml(verificationUrl: string): string {
  return `
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
  `.trim();
}

async function sendVerificationEmail(email: string, token: string): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const verificationUrl = `${backendPublicUrl}/verify-email?token=${token}`;
  try {
    const response = await axios.post(
      SENDGRID_API_URL,
      {
        personalizations: [{ to: [{ email }], subject: 'Verify your Gig-Market email address' }],
        from: { email: sendGridFromEmail, name: 'Gig-Market' },
        content: [{ type: 'text/html', value: buildVerificationEmailHtml(verificationUrl) }],
      },
      {
        headers: {
          Authorization: `Bearer ${sendGridApiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );
    const messageId = response.headers['x-message-id'];
    if (messageId) console.log(`SendGrid x-message-id: ${messageId}`);
    return { success: true, messageId };
  } catch (error: any) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    const errMsg = data ? JSON.stringify(data) : error?.message ?? String(error);
    console.error(`SendGrid status: ${status}`);
    console.error(`SendGrid response: ${errMsg}`);
    return { success: false, error: errMsg };
  }
}

async function main() {
  if (!jwtSecret) {
    console.error('JWT_SECRET is not set in .env');
    process.exit(1);
  }
  if (!sendGridApiKey && !dryRun) {
    console.error('SENDGRID_API_KEY is not set in .env');
    process.exit(1);
  }

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  const targetEmail = 'michael2geron@gmail.com';

  try {
    await client.connect();
    const res = await client.query<UserRow>(
      `SELECT id, email FROM users WHERE email IS NOT NULL AND email != '' AND email = $1 ORDER BY id`,
      [targetEmail],
    );
    const users = res.rows;
    console.log(`Found ${users.length} user(s) with email = ${targetEmail}.`);

    if (users.length === 0) {
      console.log('Nothing to send.');
      return;
    }

    if (dryRun) {
      console.log('--dry-run: would send to:');
      users.forEach((u) => console.log(`  ${u.email} (${u.id})`));
      return;
    }

    let sent = 0;
    let failed = 0;
    for (const user of users) {
      const token = jwt.sign(
        { email: user.email, type: 'email_verification' },
        jwtSecret!,
        { expiresIn: '24h' },
      );
      const result = await sendVerificationEmail(user.email, token);
      if (result.success) {
        console.log(`Sent: ${user.email}`);
        sent++;
      } else {
        console.error(`Failed: ${user.email} - ${result.error}`);
        failed++;
      }
      // 짧은 딜레이로 SendGrid rate limit 완화
      await new Promise((r) => setTimeout(r, 200));
    }

    console.log(`\nDone. Sent: ${sent}, Failed: ${failed}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
