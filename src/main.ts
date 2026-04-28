import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = Number.parseInt(String(config.get('PORT', 3001)), 10) || 3001;

  const configuredOrigins = (config.get<string>('CORS_ORIGINS', '') || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const corsOrigins: string[] =
    configuredOrigins.length > 0
      ? [...configuredOrigins]
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:5173',
        ];

  const addOrigin = (value: string): void => {
    const normalized = value.replace(/\/$/, '');
    if (normalized && !corsOrigins.includes(normalized)) {
      corsOrigins.push(normalized);
    }
  };

  // Render injecte l URL publique du service (Swagger « Try it out » = même origine).
  addOrigin(config.get<string>('RENDER_EXTERNAL_URL', ''));

  // Optionnel si l API est derrière un domaine personnalisé (non couvert par Render).
  addOrigin(config.get<string>('API_PUBLIC_URL', ''));

  if (config.get<string>('NODE_ENV') !== 'production') {
    addOrigin(`http://localhost:${port}`);
  }

  app.setGlobalPrefix(config.get<string>('API_PREFIX', 'api/v1'));
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      // Ne pas throw : sinon express renvoie 500 au lieu d un refus CORS propre.
      callback(null, false);
    },
    credentials: true,
  });
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sendiaba API')
    .setDescription("Documentation complete de l'API Sendiaba MVP")
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'bearer',
    )
    .addCookieAuth('refreshToken')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
}

void bootstrap();
