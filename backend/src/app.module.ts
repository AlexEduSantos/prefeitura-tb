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

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    CaslModule,
    PagesModule,
    ArticlesModule,
    MediaModule,
    EntitiesModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}



