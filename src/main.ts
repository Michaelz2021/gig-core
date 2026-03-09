import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';

/**
 * JSON 파싱 시 흔한 오류(trailing comma, 값 끝 따옴표 중복 등)를 보정하여 파싱.
 * Swagger/클라이언트에서 "Expected ',' or '}' after property value" 400 방지.
 */
function parseJsonLenient(raw: string): any {
  let s = raw.replace(/^\uFEFF/, ''); // BOM 제거
  // 값 끝 따옴표 중복 보정: "PSESS-xxx""  -> "PSESS-xxx"  (한 줄: "" 뒤에 , } ] / 여러 줄: "" 뒤에 줄바꿈 후 ")
  s = s.replace(/""(\s*)([,}\]])/g, '"$1$2');
  s = s.replace(/""(\s*)"/g, '"$1"'); // "" 다음에 오는 키 시작 따옴표
  try {
    return JSON.parse(s);
  } catch {
    // trailing comma 제거: , } 또는 , ] 앞의 쉼표 제거
    const fixed = s.replace(/,(\s*[}\]])/g, '$1');
    return JSON.parse(fixed);
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');

  const expressApp = app.getHttpAdapter().getInstance();

  // application/json 요청: raw 수신 후 lenient 파싱 (trailing comma 등 허용)
  expressApp.use(
    express.raw({ type: 'application/json', limit: '10mb' }),
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (Buffer.isBuffer(req.body) && req.get('content-type')?.includes('application/json')) {
        const str = req.body.toString('utf8');
        try {
          (req as any).body = parseJsonLenient(str);
        } catch (e: any) {
          const posMatch = typeof e?.message === 'string' ? e.message.match(/position (\d+)/) : null;
          const pos = posMatch ? parseInt(posMatch[1], 10) : null;
          const snippet = pos != null && str.length > 0
            ? str.slice(Math.max(0, pos - 30), pos + 30).replace(/\n/g, '\\n')
            : str.slice(0, 120).replace(/\n/g, '\\n');
          console.warn(
            `[JSON parse failed] path=${req.path} method=${req.method} message=${e?.message || e} snippet=...${snippet}...`,
          );
          next(e);
          return;
        }
      }
      next();
    },
  );
  // Flutter 등에서 bookingId만 보낼 때 booking_id로 복사 (ValidationPipe 전에 적용)
  expressApp.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    const path = (req.path || (req as any).url || '').split('?')[0];
    if (req.body && typeof req.body === 'object' && path.endsWith('/xenditprocess')) {
      const b = req.body as Record<string, unknown>;
      if (b.bookingId != null && (b.booking_id === undefined || b.booking_id === '')) {
        b.booking_id = b.bookingId;
      }
    }
    next();
  });
  // POST /api/v1/instant-bookings: 앱에서 보내는 snake_case body를 camelCase로 정규화 (ValidationPipe whitelist/검증 전)
  expressApp.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    const path = (req.path || (req as any).url || '').split('?')[0];
    if (req.method === 'POST' && path.includes('instant-bookings') && req.body && typeof req.body === 'object') {
      const b = req.body as Record<string, unknown>;
      req.body = {
        userId: b.userId ?? b.user_id,
        serviceCategoryId: b.serviceCategoryId ?? b.service_category,
        timeSlot: b.timeSlot ?? b.time_slot,
        location: b.location,
      };
    }
    next();
  });
  // application/json이 아닐 때만 기본 json 파서 사용 (json 요청은 위에서 이미 파싱됨)
  expressApp.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.get('content-type')?.includes('application/json')) {
      return next();
    }
    express.json({ limit: '10mb' })(req, res, next);
  });
  expressApp.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static files (BEFORE setGlobalPrefix)
  const uploadsPath = join(__dirname, '..', 'uploads');
  expressApp.use('/uploads', express.static(uploadsPath));

  // Global prefix (only applies to API routes registered after this)
  // Static files served above will NOT be affected by this prefix
  // verify-email / verify-email-result: 이메일 인증 링크 및 결과 화면은
  // GET /verify-email?token=..., GET /verify-email-result?... 로 바로 접근하므로 prefix 제외
  app.setGlobalPrefix(apiPrefix, { exclude: ['verify-email', 'verify-email-result'] });
  
  // CORS configuration
  // 프론트엔드와 백엔드가 분리되어 있으므로 CORS 설정 필요
  const corsOrigin = configService.get<string>('CORS_ORIGIN', '*').split(',');
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://43.201.114.64:5173',
    'http://43.201.114.64:3000',
    'http://13.125.20.235:5173',  // 프론트/API (서버 IP)
    'http://13.125.20.235:3000',  // Swagger/API - 이 오리진 없으면 브라우저에서 "Failed to fetch" 발생
    ...corsOrigin.filter((origin) => origin.trim() !== '' && origin !== '*'),
  ];

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  
  // Global filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Swagger (OpenAPI)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI TrustTrade Core API')
    .setDescription(
      'API documentation for AI TrustTrade Core Service.\n\n' +
      '**인증 (401 방지):** 1) POST /api/v1/auth/login 으로 accessToken 발급 → 2) 상단 **Authorize** 클릭 후 토큰만 붙여넣기 (Bearer 제외) → **Authorize** → **Close**\n\n' +
      '**리워드 결제 테스트 순서 (rewards):**\n' +
      '1. **POST /rewards/buy/initialization** — credits, reason, description 보내면 `payment_session_id` 반환\n' +
      '2. **POST /rewards/buy/request** — 위에서 받은 `payment_session_id` + payment_method, return_url, (CARD면 card_details) 전송 → Xendit 결제 생성, payment_url 등 반환\n' +
      '3. 결제 완료 시 웹훅으로 reward_credits / reward_credit_transactions 자동 반영',
    )
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addTag('rewards', '리워드 크레딧: 잔액/거래내역, 구매 초기화·결제 요청(Xendit)')
    .addTag('payments', '결제: wallet, booking 초기화, Xendit 처리, 상태 조회')
    .addTag('listings', 'Quick Order: 서비스 리스팅(service_listings) 조회/생성/수정/가용시간')
    .addTag('instant-bookings', 'Quick Order: 즉시 예약 요청 생성·조회(instant_bookings)')
    .addTag('booking-queue', 'Quick Order: Provider 대기열 수락(ack_item_list)')
    .addTag('instant-invoices', 'Quick Order: Order Now 인보이스 생성·결제 플로우')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });

  // Swagger Basic Auth (optional: set SWAGGER_USER and SWAGGER_PASSWORD in .env)
  const swaggerUser = configService.get<string>('SWAGGER_USER');
  const swaggerPassword = configService.get<string>('SWAGGER_PASSWORD');
  if (swaggerUser && swaggerPassword) {
    expressApp.use('/api-docs', (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Swagger"');
        return res.status(401).send('Authentication required');
      }
      const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf8');
      const [user, pass] = decoded.split(':', 2);
      if (user !== swaggerUser || pass !== swaggerPassword) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Swagger"');
        return res.status(401).send('Invalid credentials');
      }
      next();
    });
  }

  SwaggerModule.setup('api-docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
    },
  });
  
  await app.listen(port);
  
  console.log(`
    🚀 AI TrustTrade Core Service is running!
    🌍 Environment: ${configService.get('NODE_ENV')}
    📡 API: http://localhost:${port}/${apiPrefix}
    📖 Swagger: http://localhost:${port}/api-docs
    📚 Health Check: http://localhost:${port}/${apiPrefix}/health
  `);
}

bootstrap();
