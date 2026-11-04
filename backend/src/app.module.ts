import { Module } from '@nestjs/common';
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
import { ServicesService } from './service/services.service';
import { ServicesModule } from './service/services.module';
import { StoryModule } from './story/story.module';
import { ObserveModule } from './observe';
import { MenuModule } from './menu/menu.module';
import { MenuItemModule } from './menu-item/menu-item.module';
import { UserModule } from './user/user.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SettingsModule } from './settings/settings.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
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
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
