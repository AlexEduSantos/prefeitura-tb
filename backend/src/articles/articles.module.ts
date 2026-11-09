import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { ArticlesSchedulerService } from './articles-scheduler.service';

@Module({
  controllers: [ArticlesController],
  providers: [ArticlesService, ArticlesSchedulerService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
