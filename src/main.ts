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
 * JSON 파싱 시 흔한 오류(trailing comma, 값 끝 따옴표 중복, 제어문자 등)를 보정하여 파싱.
 * Swagger/HTML 클라이언트에서 "Expected ',' or '}' after property value" 400 방지.
 */
function parseJsonLenient(raw: string): any {
  let s = raw.replace(/^\uFEFF/, ''); // BOM 제거
  // 제어문자 제거 (JSON에서 문자열 밖에 있으면 문법 오류 유발; \t \n \r 제외)
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ');
  // 스마트/컬리 따옴표를 일반 따옴표로
  s = s.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
  // 값 끝 따옴표 중복 보정: "PSESS-xxx""  -> "PSESS-xxx"
  s = s.replace(/""(\s*)([,}\]])/g, '"$1$2');
  s = s.replace(/""(\s*)"/g, '"$1"');
  // trailing comma 제거: , } 또는 , ] 앞의 쉼표 제거
  s = s.replace(/,(\s*[}\]])/g, '$1');
  // 누락된 쉼표 보정: ]" 또는 }" (배열/객체 끝 바로 다음 키) → ]," / },"
  s = s.replace(/\]\s*"/g, '],"').replace(/\}\s*"/g, '},"');
  // 배열/객체 앞의 불필요한 쉼표: [ , { , 제거
  s = s.replace(/\[\s*,/g, '[').replace(/\{\s*,/g, '{');
  // 값 누락 보정: ":," / ":}" / ":]" / ": 줄바꿈" → ":null..."
  s = s.replace(/:\s*,/g, ':null,').replace(/:\s*}/g, ':null}').replace(/:\s*]/g, ':null]');
  s = s.replace(/:\s*[\r\n]+/g, ':null$&');
  // 단일 따옴표 불리언 (HTML/폼에서 올 수 있음): 'true'/'false' → true/false
  s = s.replace(/:(\s*)'true'(\s*)/g, '$1true$2').replace(/:(\s*)'false'(\s*)/g, '$1false$2');
  // Python/JS 스타일 대문자 불리언·null 보정: True->true, False->false, None->null, Null->null
  s = s.replace(/:(\s*)True\b/g, '$1true').replace(/:(\s*)False\b/g, '$1false');
  s = s.replace(/:(\s*)None\b/g, '$1null').replace(/:(\s*)Null\b/g, '$1null');
  let firstError: Error | null = null;
  try {
    return JSON.parse(s);
  } catch (e) {
    firstError = e instanceof Error ? e : new Error(String(e));
  }
  // 문자열 안의 미이스케이프 줄바꿈 보정 후 재시도
  const stringFix = s.replace(/"((?:[^"\\]|\\.)*)"/g, (_, content: string) =>
    '"' + content.replace(/\r\n/g, '\\n').replace(/\n/g, '\\n').replace(/\r/g, '\\n') + '"',
  );
  try {
    return JSON.parse(stringFix);
  } catch {
    // 두 번 다 실패 시 원래 파싱 에러(위치 정보 포함)를 다시 던져 로그/디버깅에 활용
    throw firstError ?? new Error('JSON parse failed after lenient fixes');
  }
}

/** 파싱 실패한 raw에서 temp_provider 필드만 정규식으로 추출. 필수 필드 없으면 placeholder 적용. */
function extractTempProviderFromMalformedJson(raw: string): Record<string, unknown> {
  const s = raw.replace(/^\uFEFF/, '');
  const str = (key: string) => {
    const re = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 'g');
    const m = re.exec(s);
    return m ? m[1].replace(/\\"/g, '"').trim() : undefined;
  };
  const num = (key: string) => {
    const m = new RegExp(`"${key}"\\s*:\\s*(-?\\d+)`).exec(s);
    return m ? parseInt(m[1], 10) : undefined;
  };
  const bool = (key: string) => {
    const m = new RegExp(`"${key}"\\s*:\\s*(true|false|True|False)`).exec(s);
    if (!m) return undefined;
    return m[1].toLowerCase() === 'true';
  };
  const strArray = (key: string): string[] | undefined => {
    const re = new RegExp(`"${key}"\\s*:\\s*\\[(.*?)\\]`, 's');
    const m = re.exec(s);
    if (!m) return undefined;
    const inner = m[1].trim();
    if (!inner) return [];
    const parts = inner.match(/"([^"]*)"/g);
    return parts ? parts.map((p) => p.slice(1, -1)) : [];
  };
  const email = str('email') || str('Email') || '';
  const phone = str('phone') || str('Phone') || '';
  const firstName = str('firstName') || str('first_name') || '';
  const lastName = str('lastName') || str('last_name') || '';
  return {
    email: email && /@/.test(email) ? email : (email || 'salvaged-unknown@temp.local'),
    phone: phone || 'salvaged',
    firstName: firstName || 'Unknown',
    lastName: lastName || 'Salvaged',
    profilePhotoUrl: str('profilePhotoUrl') || str('profile_photo_url'),
    address: undefined,
    businessType: str('businessType') || str('business_type'),
    businessName: str('businessName') || str('business_name'),
    serviceCategories: strArray('serviceCategories') || strArray('service_categories') || [],
    preferServiceAreas: strArray('preferServiceAreas') || strArray('prefer_service_areas') || [],
    vatable: bool('vatable') ?? false,
    tinNumber: str('tinNumber') || str('tin_number'),
    yearsOfExperience: num('yearsOfExperience') ?? num('years_of_experience') ?? 0,
    certifications: [],
    portfolioPhotos: [],
    instantBooking: bool('instantBooking') ?? bool('instant_booking') ?? true,
    serviceRadiusKm: num('serviceRadiusKm') ?? num('service_radius_km') ?? 10,
    responseTimeMinutes: num('responseTimeMinutes') ?? num('response_time_minutes'),
    notificationPreferences: undefined,
    availableDays: strArray('availableDays') || strArray('available_days'),
    availableHoursStart: str('availableHoursStart') || str('available_hours_start'),
    availableHoursEnd: str('availableHoursEnd') || str('available_hours_end'),
  };
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');

  const expressApp = app.getHttpAdapter().getInstance();

  // CORS: 요청 출처 허용 + OPTIONS 200 (프론트엔드 www.gigmarket.ph 등에서 API 호출 허용)
  const corsAllowedOrigins = [
    'https://www.gigmarket.ph',
    'http://www.gigmarket.ph',
    'http://localhost:8080',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  const corsOriginFromEnv = configService.get<string>('CORS_ORIGIN', '');
  if (corsOriginFromEnv) {
    corsAllowedOrigins.push(...corsOriginFromEnv.split(',').map((o) => o.trim()).filter(Boolean));
  }
  expressApp.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    const origin = req.headers.origin;
    const allowOrigin =
      origin && corsAllowedOrigins.includes(origin) ? origin : corsAllowedOrigins[0] || '*';
    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // application/json 요청: raw 수신 후 lenient 파싱 (trailing comma 등 허용)
  expressApp.use(
    express.raw({ type: 'application/json', limit: '10mb' }),
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (Buffer.isBuffer(req.body) && req.get('content-type')?.includes('application/json')) {
        const str = req.body.toString('utf8');
        try {
          (req as any).body = parseJsonLenient(str);
        } catch (e: any) {
          const path = (req.path || '').split('?')[0];
          const isTempRegister =
            req.method === 'POST' && path.includes('temp_providers/register');
          if (isTempRegister) {
            try {
              (req as any).body = extractTempProviderFromMalformedJson(str);
              console.warn(
                `[temp_providers/register] JSON parse failed; salvaged ${Object.keys((req as any).body).length} fields from raw body and continuing.`,
              );
              return next();
            } catch (salvageErr) {
              console.warn('[temp_providers/register] salvage failed', salvageErr);
            }
          }
          const posMatch = typeof e?.message === 'string' ? e.message.match(/position (\d+)/) : null;
          const pos = posMatch ? parseInt(posMatch[1], 10) : null;
          const half = isTempRegister ? 80 : 30;
          const snippet = pos != null && str.length > 0
            ? str.slice(Math.max(0, pos - half), pos + half).replace(/\n/g, '\\n')
            : str.slice(0, 120).replace(/\n/g, '\\n');
          console.warn(
            `[JSON parse failed] path=${req.path} method=${req.method} message=${e?.message || e} snippet=...${snippet}...`,
          );
          if (isTempRegister && pos != null && str.length > pos) {
            const at = str[pos];
            const around = str.slice(Math.max(0, pos - 5), pos + 6).replace(/\n/g, '\\n').replace(/\r/g, '\\r');
            console.warn(`[temp_providers/register] position ${pos} char="${at}" code=${str.charCodeAt(pos)} around=...${around}...`);
          }
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
  // POST temp_providers/register: HTML/클라이언트에서 보내는 snake_case 또는 추가 필드를 camelCase로 정규화 (ValidationPipe 400 방지)
  expressApp.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    const path = (req.path || (req as any).url || '').split('?')[0];
    if (
      req.method === 'POST' &&
      path.includes('temp_providers/register') &&
      req.body &&
      typeof req.body === 'object'
    ) {
      const b = req.body as Record<string, unknown>;
      const pick = (camel: string, snake: string) => b[camel] ?? b[snake];
      const nested = (key: string) => {
        const val = b[key] ?? b[key.replace(/([A-Z])/g, '_$1').toLowerCase()];
        return val;
      };
      req.body = {
        email: pick('email', 'email'),
        phone: pick('phone', 'phone'),
        profilePhotoUrl: pick('profilePhotoUrl', 'profile_photo_url'),
        firstName: pick('firstName', 'first_name'),
        lastName: pick('lastName', 'last_name'),
        address: nested('address'),
        businessType: pick('businessType', 'business_type'),
        businessName: pick('businessName', 'business_name'),
        serviceCategories: pick('serviceCategories', 'service_categories'),
        preferServiceAreas: pick('preferServiceAreas', 'prefer_service_areas'),
        vatable: pick('vatable', 'vatable'),
        tinNumber: pick('tinNumber', 'tin_number'),
        yearsOfExperience: pick('yearsOfExperience', 'years_of_experience'),
        certifications: nested('certifications'),
        portfolioPhotos: nested('portfolioPhotos') ?? nested('portfolio_photos'),
        instantBooking: pick('instantBooking', 'instant_booking'),
        serviceRadiusKm: pick('serviceRadiusKm', 'service_radius_km'),
        responseTimeMinutes: pick('responseTimeMinutes', 'response_time_minutes'),
        notificationPreferences: nested('notificationPreferences') ?? nested('notification_preferences'),
        availableDays: pick('availableDays', 'available_days'),
        availableHoursStart: pick('availableHoursStart', 'available_hours_start'),
        availableHoursEnd: pick('availableHoursEnd', 'available_hours_end'),
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
    'http://13.125.20.235:3000',  // Swagger/API
    'http://www.gigmarket.ph:3000',
    'https://www.gigmarket.ph',
    'http://gigmarket.ph:3000',
    'https://gigmarket.ph',
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
