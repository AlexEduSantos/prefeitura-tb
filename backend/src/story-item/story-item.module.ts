import { Module } from '@nestjs/common';
import { StoryItemService } from './story-item.service';
import { StoryItemController } from './story-item.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [StoryItemController],
  providers: [StoryItemService, PrismaService],
})
export class StoryItemModule {}
