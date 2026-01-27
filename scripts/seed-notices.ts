import { DataSource } from 'typeorm';
import { Notice, NoticeType } from '../src/modules/notices/entities/notice.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

const noticeSamples = [
  {
    type: NoticeType.NOTICE,
    title: 'System Maintenance Notice',
    summary: 'System maintenance will be conducted from 2:00 AM to 4:00 AM on January 20, 2025.',
    content: `Hello, this is the AI TrustTrade operations team.

We will be conducting system maintenance to improve service stability. Please refer to the details below.

■ Maintenance Schedule
- Date & Time: January 20, 2025 (Monday) 02:00 ~ 04:00 (2 hours)
- Service may be temporarily unavailable during maintenance.

■ Maintenance Details
- Server performance optimization
- Security system updates
- Database optimization

We apologize for any inconvenience during the maintenance period.
We will continue to provide better services.

Thank you.`,
    images: [
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
    ],
    isActive: true,
  },
  {
    type: NoticeType.NOTICE,
    title: 'Privacy Policy Update Notice',
    summary: 'Our privacy policy will be updated effective February 1, 2025.',
    content: `Hello, this is the AI TrustTrade operations team.

We have revised our privacy policy to provide better services.
Please review the changes and agree to the updated policy.

■ Effective Date
- February 1, 2025 (Saturday) 00:00

■ Major Changes
1. Clarification of data retention and usage periods
2. Detailed third-party sharing information
3. Disclosure of data processing vendors
4. Enhanced user rights

You can view the detailed privacy policy in the app's 'Privacy Policy' menu.
Service may be restricted if you do not agree to the changes.`,
    images: [],
    isActive: true,
  },
  {
    type: NoticeType.NOTICE,
    title: 'New Payment Methods Added',
    summary: 'GCash and PayMaya payment methods have been added.',
    content: `Hello, AI TrustTrade users.

We have added new payment methods for your convenience.

■ New Payment Methods
- GCash
- PayMaya

You can now pay easily using a variety of methods.

■ Payment Guidelines
- Please verify the amount and details before completing payment.
- For payment cancellations, please contact our customer support.

We will continue to work towards providing more convenient services.`,
    images: [
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
    ],
    isActive: true,
  },
  {
    type: NoticeType.NOTICE,
    title: 'Terms of Service Update Notice',
    summary: 'Our Terms of Service will be updated effective January 15, 2025.',
    content: `Hello, this is the AI TrustTrade operations team.

We have revised our Terms of Service to improve our services.

■ Effective Date
- January 15, 2025 (Wednesday) 00:00

■ Major Changes
1. Clarified dispute resolution procedures
2. Enhanced service usage restrictions
3. Clarified limitation of liability
4. Detailed user obligations

You can view the detailed Terms of Service in the app's 'Terms of Service' menu.
Continued use of the service constitutes acceptance of the updated terms.`,
    images: [],
    isActive: true,
  },
  {
    type: NoticeType.NOTICE,
    title: 'Customer Support Hours Change Notice',
    summary: 'Our customer support hours have been updated.',
    content: `Hello, AI TrustTrade users.

We would like to inform you about changes to our customer support hours.

■ Updated Support Hours
- Weekdays: 9:00 AM ~ 6:00 PM
- Weekends and holidays: Closed

■ Contact Information
- Email: support@trusttrade.com
- Phone: +63-2-1234-5678

■ Inquiries
You can contact us anytime through our 24/7 FAQ and 1:1 inquiry system.

We will do our best to provide better services.`,
    images: [],
    isActive: true,
  },
];

const newsSamples = [
  {
    type: NoticeType.NEWS,
    title: 'AI TrustTrade Surpasses 100,000 New Users in First Half of 2025',
    summary: 'The platform continues to grow, reaching 100,000 new registrations in the first half of the year.',
    content: `AI TrustTrade has achieved remarkable growth, surpassing 100,000 new users in the first half of 2025.

■ Key Achievements
- New registrations in H1 2025: Over 100,000
- Monthly Active Users (MAU): 50% increase
- Cumulative service transactions: Over 500,000

■ Growth Drivers
Improved accuracy of our AI-based matching system and expanded service categories have led to higher user satisfaction.

Additionally, our trust score system for secure transactions and 24/7 customer support have contributed to new user acquisition.

■ Future Plans
- Service area expansion in the second half
- New service categories
- Enhanced AI matching algorithms

AI TrustTrade will continue to work towards providing better services.`,
    images: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
    ],
    isActive: true,
  },
  {
    type: NoticeType.NEWS,
    title: 'Premium Service Provider Badge System Launched',
    summary: 'We have introduced a new badge system to certify outstanding service providers.',
    content: `AI TrustTrade has introduced a 'Premium Provider Badge' system to certify outstanding service providers.

■ Badge System Overview
Premium badges are awarded to providers with exceptional service quality and customer satisfaction.

■ Badge Requirements
- Average rating of 4.5 or higher
- Completion rate of 95% or higher
- 50 or more reviews
- Trust score of 800 or higher

■ Badge Benefits
- Top placement in search results
- Badge display on profile page
- Priority matching support
- Promotional benefits

This new system will help connect better service providers with customers.`,
    images: [
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800',
    ],
    isActive: true,
  },
  {
    type: NoticeType.NEWS,
    title: 'Mobile App Update: Faster and More Convenient Experience',
    summary: 'User experience has been improved with the new mobile app update.',
    content: `Introducing the new update for the AI TrustTrade mobile app.

■ Key Improvements
1. 50% faster app launch speed
2. More intuitive UI/UX
3. Enhanced real-time notifications
4. Offline mode support

■ New Features
- Real-time chat with service providers
- Location-based service search
- Easy payment options
- Review writing guide

■ How to Update
- iOS: Update from the App Store
- Android: Update from Google Play Store

We will continue to improve for a better service experience.`,
    images: [
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
    ],
    isActive: true,
  },
  {
    type: NoticeType.NEWS,
    title: 'Service Provider Training Program Launched',
    summary: 'We are starting a training program for providers to improve service quality.',
    content: `AI TrustTrade has launched a professional training program for service providers.

■ Program Purpose
Designed to enhance provider expertise and improve customer satisfaction.

■ Training Content
1. Customer service skills
2. Service quality management
3. Safety management
4. Digital marketing basics

■ Training Benefits
- Certificate issuance
- Priority Premium Provider badge
- Top profile placement

■ How to Participate
You can apply through the 'Provider Center' in the app.

Let's grow together with AI TrustTrade.`,
    images: [
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
    ],
    isActive: true,
  },
  {
    type: NoticeType.NEWS,
    title: 'AI Matching Accuracy Reaches 95%, Customer Satisfaction Significantly Improved',
    summary: 'We have achieved 95% accuracy with our enhanced AI matching system.',
    content: `AI TrustTrade's AI-based matching system has achieved 95% accuracy, significantly improving customer satisfaction.

■ AI Matching System Overview
Analyzes customer requirements and provider expertise to suggest optimal matches.

■ Accuracy Improvement Factors
- Enhanced machine learning algorithms
- User feedback integration
- Big data analysis-based improvements

■ Customer Satisfaction
- Matching success rate: 95%
- Average response time: Within 5 minutes
- Customer satisfaction: 4.7/5.0

■ Future Plans
- Target 98% AI accuracy
- Personalized recommendation system
- Voice recognition-based matching search

AI TrustTrade will continue to provide better services through technological innovation.`,
    images: [
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800',
    ],
    isActive: true,
  },
];

async function seedNotices() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'ai_trusttrade',
    entities: [path.join(__dirname, '../src/**/*.entity{.ts,.js}')],
    synchronize: false,
    logging: true,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false,
    } : false,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    const noticeRepository = dataSource.getRepository(Notice);

    // 기존 공지사항 삭제
    const existingNotices = await noticeRepository.find();
    if (existingNotices.length > 0) {
      console.log(`Found ${existingNotices.length} existing notices. Deleting...`);
      await noticeRepository.remove(existingNotices);
      console.log('✓ Existing notices removed');
    } else {
      console.log('No existing notices found.');
    }

    // 공지사항 5개 추가
    console.log('Creating notice samples...');
    for (const noticeData of noticeSamples) {
      const notice = noticeRepository.create({
        ...noticeData,
        publishedAt: new Date(),
      });
      await noticeRepository.save(notice);
      console.log(`✓ Created notice: ${notice.title}`);
    }

    // 뉴스 5개 추가
    console.log('Creating news samples...');
    for (const newsData of newsSamples) {
      const notice = noticeRepository.create({
        ...newsData,
        publishedAt: new Date(),
      });
      await noticeRepository.save(notice);
      console.log(`✓ Created news: ${notice.title}`);
    }

    console.log('\n✅ All notices and news have been seeded successfully!');
    console.log(`Total: ${noticeSamples.length} notices + ${newsSamples.length} news`);

  } catch (error) {
    console.error('Error seeding notices:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('Database connection closed');
  }
}

seedNotices()
  .then(() => {
    console.log('Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
