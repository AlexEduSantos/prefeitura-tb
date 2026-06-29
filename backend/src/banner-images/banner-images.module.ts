import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CaslModule } from '../casl/casl.module';
import { BannerImagesController } from './banner-images.controller';
import { BannerImagesService } from './banner-images.service';

@Module({
  imports: [PrismaModule, CaslModule],
  controllers: [BannerImagesController],
  providers: [BannerImagesService],
  exports: [BannerImagesService],
})
export class BannerImagesModule {}
