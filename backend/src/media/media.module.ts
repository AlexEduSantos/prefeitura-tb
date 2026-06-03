import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { FoldersService } from './folders.service';
import { MediaController } from './media.controller';
import { BullModule } from '@nestjs/bullmq';
import { MediaProcessor } from './media.processor';
import { MediaGateway } from './media.gateway';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: 'media-processing',
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService, FoldersService, MediaProcessor, MediaGateway],
  exports: [MediaService, FoldersService],
})
export class MediaModule {}
