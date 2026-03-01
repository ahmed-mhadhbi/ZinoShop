import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { initializeFirebase } from './config/firebase.config';
import { CacheInterceptor } from './common/interceptors/cache.interceptor';
import compression = require('compression');
import * as express from 'express';
import { rateLimit } from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Disable default body parser to configure custom limits
  });

  // Initialize Firebase
  const configService = app.get(ConfigService);
  initializeFirebase(configService);

  // Configure body parser limits (tunable via env for low-memory hosts)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);
  expressApp.disable('x-powered-by');
  const bodySizeLimit = process.env.BODY_SIZE_LIMIT || '10mb';
  expressApp.use(express.json({ limit: bodySizeLimit }));
  expressApp.use(express.urlencoded({ limit: bodySizeLimit, extended: true }));

  // Security
  app.use(helmet());
  app.use(compression());
  app.use(
    rateLimit({
      windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
      max: Number(process.env.RATE_LIMIT_MAX || 120),
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        statusCode: 429,
        message: 'Too many requests, please retry shortly.',
      },
    }),
  );

  // CORS
  const configuredOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const defaultAllowedOrigins = [
    'http://localhost:3000',
    'https://zino-shop.vercel.app',
    'https://www.zino-shop.vercel.app',
  ];
  const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...configuredOrigins]));

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global cache interceptor for GET requests
  app.useGlobalInterceptors(new CacheInterceptor());

  // API prefix
  app.setGlobalPrefix('api');

  const swaggerEnabled =
    process.env.SWAGGER_ENABLED === 'true' ||
    process.env.NODE_ENV !== 'production';
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('ZinoShop API')
      .setDescription('The ZinoShop E-commerce API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  if (swaggerEnabled) {
    console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
  }
}
bootstrap();
