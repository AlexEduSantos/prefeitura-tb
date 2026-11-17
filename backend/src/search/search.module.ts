import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { ArticlesModule } from '../articles/articles.module';
import { OfficialGazetteModule } from '../official-gazette/official-gazette.module';
import { PagesModule } from '../pages/pages.module';

@Module({
  imports: [ArticlesModule, OfficialGazetteModule, PagesModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
