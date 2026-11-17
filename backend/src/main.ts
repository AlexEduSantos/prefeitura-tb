import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ObserveInstrument } from './observe';
import session from 'express-session';
import passport from 'passport';
import { Pool } from 'pg';
import helmet from 'helmet';
import { ExcludePasswordInterceptor } from './common/interceptors/exclude-password.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { PrismaClientExceptionFilter } from './common/filters/prisma-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { validateEnv } from './common/config/env.validation';
import { TelemetryService } from './common/telemetry/telemetry.service';
import { bullBoardAdminMiddleware } from './common/middleware/bull-board-admin.middleware';
import { csrfProtectionMiddleware } from './common/middleware/csrf.middleware';

async function bootstrap() {
  const env = validateEnv(process.env);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    instrument: ObserveInstrument,
  });

  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalInterceptors(new ExcludePasswordInterceptor());

  const pgSession = require('connect-pg-simple')(session);
  const pgPool = new Pool({
    connectionString: env.DATABASE_URL,
  });

  app.use(
    session({
      store: new pgSession({
        pool: pgPool,
        tableName: 'session',
      }),
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.NODE_ENV === 'production',
        maxAge: 8 * 60 * 60 * 1000, // 8 horas
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(csrfProtectionMiddleware);
  app.use('/admin/queues', bullBoardAdminMiddleware);
  const telemetryService = app.get(TelemetryService, { strict: false });
  app.useGlobalFilters(new PrismaClientExceptionFilter(telemetryService));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('API Portal da Prefeitura')
    .setDescription(
      'Documentação interativa da API do Portal da Prefeitura (Notícias, Mídias, Stories, Galerias, Menus e Administração)',
    )
    .setVersion('1.0')
    .addCookieAuth('connect.sid')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Documentação da API - Prefeitura',
  });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
