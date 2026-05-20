import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';

@Module({
  imports: [
    MulterModule.register({
      dest: '/app/uploads', // Caminho absoluto para o volume Docker
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}


