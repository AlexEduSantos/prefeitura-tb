import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CaslModule } from '../casl/casl.module';
import { GalleryMediaController } from './gallery-media.controller';
import { GalleryMediaService } from './gallery-media.service';

@Module({
  imports: [PrismaModule, CaslModule],
  controllers: [GalleryMediaController],
  providers: [GalleryMediaService],
  exports: [GalleryMediaService],
})
export class GalleryMediaModule {}
