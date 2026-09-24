import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ObserveInstrument } from './observe';
import session from 'express-session';
import passport from 'passport';
import { Pool } from 'pg';
import { ExcludePasswordInterceptor } from './common/interceptors/exclude-password.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { PrismaClientExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    instrument: ObserveInstrument,
  });

  // Servir arquivos do volume de uploads do Docker no endpoint /uploads
  app.useStaticAssets('/app/uploads', {
    prefix: '/uploads/',
  });

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalInterceptors(new ExcludePasswordInterceptor());

  const pgSession = require('connect-pg-simple')(session);
  const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  app.use(
    session({
      store: new pgSession({
        pool: pgPool,
        tableName: 'session',
      }),
      secret: process.env.SESSION_SECRET || 'super-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 8 * 60 * 60 * 1000, // 8 horas
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());
  app.useGlobalFilters(new PrismaClientExceptionFilter());

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
