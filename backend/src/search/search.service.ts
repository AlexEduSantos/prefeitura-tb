import { Injectable } from '@nestjs/common';
import { ArticlesService } from '../articles/articles.service';
import { OfficialGazetteService } from '../official-gazette/official-gazette.service';
import { PagesService } from '../pages/pages.service';

export interface UnifiedSearchResult {
  query: string;
  totals: {
    articles: number;
    officialGazettes: number;
    pages: number;
    overall: number;
  };
  results: {
    articles: unknown[];
    officialGazettes: unknown[];
    pages: unknown[];
  };
}

@Injectable()
export class SearchService {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly officialGazetteService: OfficialGazetteService,
    private readonly pagesService: PagesService,
  ) {}

  async searchAll(query: string, limit = 15): Promise<UnifiedSearchResult> {
    const cleanQuery = query?.trim() || '';
    const safeLimit = Math.min(50, Math.max(1, Math.floor(limit) || 15));

    if (!cleanQuery) {
      return {
        query: '',
        totals: { articles: 0, officialGazettes: 0, pages: 0, overall: 0 },
        results: { articles: [], officialGazettes: [], pages: [] },
      };
    }

    const [articlesRaw, gazettesRaw, pagesRaw] = await Promise.all([
      this.articlesService.findAll(cleanQuery),
      this.officialGazetteService.findAllPublic({
        search: cleanQuery,
        page: 1,
        limit: safeLimit,
      }),
      this.pagesService.findPublicPages(cleanQuery),
    ]);

    const articles: unknown[] = Array.isArray(articlesRaw)
      ? articlesRaw.slice(0, safeLimit)
      : [];
    const gazetteData = (gazettesRaw as { data?: unknown[] } | null)?.data;
    const officialGazettes: unknown[] = Array.isArray(gazetteData)
      ? gazetteData.slice(0, safeLimit)
      : [];
    const pages: unknown[] = Array.isArray(pagesRaw)
      ? pagesRaw.slice(0, safeLimit)
      : [];

    const overall = articles.length + officialGazettes.length + pages.length;

    return {
      query: cleanQuery,
      totals: {
        articles: articles.length,
        officialGazettes: officialGazettes.length,
        pages: pages.length,
        overall,
      },
      results: {
        articles,
        officialGazettes,
        pages,
      },
    };
  }
}
