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
import { EntitiesModule } from './entities/entities.module';
import { MenusModule } from './menus/menus.module';
import { BullModule } from '@nestjs/bullmq';
import { GalleriesModule } from './galleries/galleries.module';
import { GalleryMediaModule } from './gallery-media/gallery-media.module';
import { PopupsModule } from './popups/popups.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    AuthModule,
    PrismaModule,
    CaslModule,
    PagesModule,
    ArticlesModule,
    MediaModule,
    EntitiesModule,
    MenusModule,
    GalleriesModule,
    GalleryMediaModule,
    PopupsModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
