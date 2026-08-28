import { Module } from '@nestjs/common';
import { StoryService } from './story.service';
import { StoryController } from './story.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ServicesService } from '../service/services.service';

@Module({
  imports: [PrismaModule],
  controllers: [StoryController],
  providers: [StoryService, ServicesService],
})
export class StoryModule {}
