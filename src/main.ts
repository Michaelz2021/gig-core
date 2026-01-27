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

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  
  // IMPORTANT: Serve static files for admin dashboard and uploads BEFORE global prefix
  // This ensures /admin and /uploads routes are accessible without the API prefix
  const adminPath = join(__dirname, '..', 'admin');
  const uploadsPath = join(__dirname, '..', 'uploads');
  const express = require('express');
  
  // Get the underlying Express instance
  const expressApp = app.getHttpAdapter().getInstance();
  
  // Serve uploads directory as static files (BEFORE setGlobalPrefix)
  // This allows /uploads/* to be accessed directly
  expressApp.use('/uploads', express.static(uploadsPath));
  
  // Serve static files with index.html as default
  // This must be done BEFORE setGlobalPrefix
  expressApp.use('/admin', express.static(adminPath, { 
    index: 'index.html',
    extensions: ['html'],
  }));
  
  // Explicitly handle /admin and /admin/ routes
  expressApp.get('/admin', (req, res) => {
    res.sendFile(join(adminPath, 'index.html'));
  });
  
  expressApp.get('/admin/', (req, res) => {
    res.sendFile(join(adminPath, 'index.html'));
  });
  
  // Global prefix (only applies to API routes registered after this)
  // Static files served above will NOT be affected by this prefix
  app.setGlobalPrefix(apiPrefix);
  
  // CORS configuration
  // 프론트엔드와 백엔드가 분리되어 있으므로 CORS 설정 필요
  const corsOrigin = configService.get<string>('CORS_ORIGIN', '*').split(',');
  const allowedOrigins = [
    'http://localhost:5173',      // 프론트엔드 개발 서버
    'http://43.201.114.64:5173',  // 프론트엔드 프로덕션
    ...corsOrigin.filter(origin => origin !== '*'), // 기존 설정 유지
  ];
  
  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
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
    .setDescription('API documentation for AI TrustTrade Core Service')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });
  SwaggerModule.setup('api-docs', app, swaggerDocument, {
    swaggerOptions: { persistAuthorization: true },
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
