import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { CaslModule } from './casl/casl.module';
import { PagesModule } from './pages/pages.module';
import { ArticlesModule } from './articles/articles.module';
import { MediaModule } from './media/media.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { SpacesModule } from './spaces/spaces.module';
import { CategoriesModule } from './categories/categories.module';
import { BullModule } from '@nestjs/bullmq';
import { GalleriesModule } from './galleries/galleries.module';
import { GalleryMediaModule } from './gallery-media/gallery-media.module';
import { PopupsModule } from './popups/popups.module';
import { ServicesModule } from './service/services.module';
import { StoryModule } from './story/story.module';
import { ObserveModule } from './observe';
import { MenuModule } from './menu/menu.module';
import { MenuItemModule } from './menu-item/menu-item.module';
import { UserModule } from './user/user.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SettingsModule } from './settings/settings.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuditModule } from './audit/audit.module';
import { AuditInterceptor } from './audit/audit.interceptor';
import { OfficialGazetteModule } from './official-gazette/official-gazette.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { RedisCacheModule } from './common/cache/redis-cache.module';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { TelemetryModule } from './common/telemetry/telemetry.module';
import { BackupModule } from './backup/backup.module';
import { bullBoardAdminMiddleware } from './common/middleware/bull-board-admin.middleware';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    RedisCacheModule,
    TelemetryModule,
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
      middleware: bullBoardAdminMiddleware,
    }),
    EventEmitterModule.forRoot(),
    AuthModule,
    PrismaModule,
    CaslModule,
    PagesModule,
    ArticlesModule,
    MediaModule,
    MenuModule,
    OrganizationsModule,
    SpacesModule,
    CategoriesModule,
    GalleriesModule,
    GalleryMediaModule,
    PopupsModule,
    ServicesModule,
    StoryModule,
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY!,
      appSecret: process.env.OBSERVE_APP_SECRET!,
      serviceId: 'site-prefeitura',
    }),
    MenuItemModule,
    UserModule,
    SettingsModule,
    AnalyticsModule,
    AuditModule,
    OfficialGazetteModule,
    BackupModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
