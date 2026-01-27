import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'trusttrade',
  password: process.env.DB_PASSWORD || 'secure_password_123',
  database: process.env.DB_DATABASE || 'ai_trusttrade',
});

async function resetTestUsers() {
  try {
    await dataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공');

    const emails = [
      'test@example.com',
      'provider@example.com',
      'both@example.com',
    ];

    const inParams = emails.map((_, i) => `$${i + 1}`).join(',');
    const result = await dataSource.query(
      `DELETE FROM users WHERE email IN (${inParams});`,
      emails,
    );

    console.log('🧹 삭제 완료:', result);
    await dataSource.destroy();
    console.log('✅ 완료!');
  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  }
}

resetTestUsers();


