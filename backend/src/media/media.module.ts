import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { FoldersService } from './folders.service';
import { MediaController } from './media.controller';
import { BullModule } from '@nestjs/bullmq';
import { MediaProcessor } from './media.processor';
import { MediaGateway } from './media.gateway';
import { ConfigModule } from '@nestjs/config';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: 'media-processing',
    }),
    BullBoardModule.forFeature({
      name: 'media-processing',
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService, FoldersService, MediaProcessor, MediaGateway],
  exports: [MediaService, FoldersService],
})
export class MediaModule {}
