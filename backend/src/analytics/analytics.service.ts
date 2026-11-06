import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UmamiStatsResponse {
  visitors: number;
  pageviews: number;
  visits: number;
  bounces: number;
  totaltime: number;
}

export interface UmamiPageviewsResponse {
  pageviews: Array<{ x: string; y: number }>;
}

export interface TopNewsItem {
  id: string | null;
  title: string;
  slug: string;
  views: number;
  visitors: number;
  publicationDate: Date | null;
  coverUrl: string | null;
}

export interface TopPageItem {
  id: string | null;
  title: string;
  path: string;
  slug: string;
  views: number;
  visitors: number;
  updatedAt: Date | null;
}

@Injectable()
export class AnalyticsService {
  private token: string | null = null;

  constructor(private prisma: PrismaService) {}

  /**
   * Obtém o token JWT autenticando no Umami.
   */
  private async getAuthToken(forceRefresh = false): Promise<string> {
    if (this.token && !forceRefresh) {
      return this.token;
    }

    const apiUrl = process.env.UMAMI_API_URL;
    const username = process.env.UMAMI_USERNAME;
    const password = process.env.UMAMI_PASSWORD;

    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error(
        `Falha na autenticação do Umami: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    this.token = data.token;
    return this.token || '';
  }

  async getSummaryStats(
    initDate?: string,
    finalDate?: string,
  ): Promise<UmamiStatsResponse> {
    const startAt =
      initDate && !isNaN(new Date(initDate).getTime())
        ? new Date(initDate).getTime()
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime();
    const endAt =
      finalDate && !isNaN(new Date(finalDate).getTime())
        ? new Date(finalDate).getTime()
        : Date.now();

    const url = `${process.env.UMAMI_API_URL}/api/websites/${process.env.UMAMI_WEBSITE_ID}/stats?startAt=${startAt}&endAt=${endAt}`;

    try {
      let token = await this.getAuthToken();

      let response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Se o token expirou (401), renova e tenta mais uma vez
      if (response.status === 401) {
        token = await this.getAuthToken(true);
        response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      if (!response.ok) {
        throw new Error(
          `Umami API error: ${response.status} ${response.statusText}`,
        );
      }

      return (await response.json()) as UmamiStatsResponse;
    } catch (error) {
      console.error('Erro ao buscar dados do Umami:', error);
      throw new InternalServerErrorException(
        'Não foi possível carregar as estatísticas.',
      );
    }
  }

  async getPageViewsStats(
    initDate?: string,
    finalDate?: string,
    unit: 'day' | 'month' | 'year' | 'hour' = 'day',
    timezone = 'America/Sao_Paulo',
  ): Promise<UmamiPageviewsResponse> {
    const startAt =
      initDate && !isNaN(new Date(initDate).getTime())
        ? new Date(initDate).getTime()
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime();
    const endAt =
      finalDate && !isNaN(new Date(finalDate).getTime())
        ? new Date(finalDate).getTime()
        : Date.now();

    const url = `${process.env.UMAMI_API_URL}/api/websites/${process.env.UMAMI_WEBSITE_ID}/pageviews?startAt=${startAt}&endAt=${endAt}&unit=${unit}&timezone=${timezone}`;

    try {
      let token = await this.getAuthToken();

      let response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Se o token expirou (401), renova e tenta mais uma vez
      if (response.status === 401) {
        token = await this.getAuthToken(true);
        response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      if (!response.ok) {
        throw new Error(
          `Umami API error: ${response.status} ${response.statusText}`,
        );
      }

      return (await response.json()) as UmamiPageviewsResponse;
    } catch (error) {
      console.error('Erro ao buscar dados do Umami:', error);
      throw new InternalServerErrorException(
        'Não foi possível carregar as estatísticas.',
      );
    }
  }

  /**
   * Retorna as notícias mais visualizadas no período selecionado,
   * cruzando as métricas de URL do Umami com os registros de Artigos no banco.
   * Utiliza /metrics/expanded para obter a contagem real de pageviews (visualizações de página).
   */
  async getTopNews(
    range: 'day' | 'week' | 'month' | 'year' | 'all' = 'week',
    initDate?: string,
    finalDate?: string,
    limit = 5,
  ): Promise<TopNewsItem[]> {
    const now = Date.now();
    let startAt: number;

    if (initDate && !isNaN(new Date(initDate).getTime())) {
      startAt = new Date(initDate).getTime();
    } else {
      switch (range) {
        case 'day':
          startAt = now - 24 * 60 * 60 * 1000;
          break;
        case 'week':
          startAt = now - 7 * 24 * 60 * 60 * 1000;
          break;
        case 'month':
          startAt = now - 30 * 24 * 60 * 60 * 1000;
          break;
        case 'year':
          startAt = now - 365 * 24 * 60 * 60 * 1000;
          break;
        case 'all':
          startAt = 0;
          break;
        default:
          startAt = now - 7 * 24 * 60 * 60 * 1000;
          break;
      }
    }

    const endAt =
      finalDate && !isNaN(new Date(finalDate).getTime())
        ? new Date(finalDate).getTime()
        : now;

    // /metrics/expanded retorna { name, pageviews, visitors, visits }
    const expandedUrl = `${process.env.UMAMI_API_URL}/api/websites/${process.env.UMAMI_WEBSITE_ID}/metrics/expanded?type=path&startAt=${startAt}&endAt=${endAt}&limit=500`;
    const standardUrl = `${process.env.UMAMI_API_URL}/api/websites/${process.env.UMAMI_WEBSITE_ID}/metrics?type=path&startAt=${startAt}&endAt=${endAt}&limit=500`;

    try {
      let token = await this.getAuthToken();

      let response = await fetch(expandedUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        token = await this.getAuthToken(true);
        response = await fetch(expandedUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      // Se /metrics/expanded não estiver disponível, faz fallback para /metrics
      if (!response.ok && response.status === 404) {
        response = await fetch(standardUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      if (!response.ok) {
        throw new Error(
          `Umami API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      // Agrupa e soma visualizações reais e visitantes por slug limpo de notícia
      const viewsBySlug = new Map<string, { views: number; visitors: number }>();

      if (Array.isArray(data)) {
        for (const item of data) {
          // No /metrics/expanded o campo é item.name; no /metrics padrão é item.x
          const rawPath = item?.name || item?.x;
          if (!rawPath || typeof rawPath !== 'string') continue;
          const path = rawPath.trim();

          const match = path.match(/^\/noticias?\/(.+)$/);
          if (!match) continue;

          // Remove query params, hash e barra final
          const rawSlug = match[1]
            .split('?')[0]
            .split('#')[0]
            .replace(/\/$/, '')
            .trim();

          if (!rawSlug) continue;

          // 'pageviews' traz o total real de visualizações; 'visitors' traz os usuários únicos
          const pageviews = Number(item.pageviews) || Number(item.y) || 0;
          const visitors = Number(item.visitors) || Number(item.y) || 0;

          const current = viewsBySlug.get(rawSlug) || { views: 0, visitors: 0 };
          viewsBySlug.set(rawSlug, {
            views: current.views + pageviews,
            visitors: current.visitors + visitors,
          });
        }
      }

      // Ordena por visualizações (pageviews) de forma decrescente
      const sortedEntries = Array.from(viewsBySlug.entries())
        .sort((a, b) => b[1].views - a[1].views)
        .slice(0, limit);

      if (sortedEntries.length === 0) {
        return [];
      }

      const slugs = sortedEntries.map(([slug]) => slug);

      // Busca dados dos artigos no banco de dados para obter o título real
      const articles = await this.prisma.article.findMany({
        where: {
          slug: {
            in: slugs,
          },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          publicationDate: true,
          cover: {
            select: {
              url: true,
            },
          },
        },
      });

      const articleMap = new Map(articles.map((art) => [art.slug, art]));

      return sortedEntries.map(([slug, metrics]) => {
        const article = articleMap.get(slug);
        return {
          id: article?.id || null,
          title: article?.title || slug.replace(/-/g, ' '),
          slug,
          views: metrics.views,
          visitors: metrics.visitors,
          publicationDate: article?.publicationDate || null,
          coverUrl: article?.cover?.url || null,
        };
      });
    } catch (error) {
      console.error('Erro ao buscar top news do Umami:', error);
      throw new InternalServerErrorException(
        'Não foi possível carregar as notícias mais visualizadas.',
      );
    }
  }

  /**
   * Retorna as páginas mais visitadas no período selecionado,
   * excluindo notícias e rotas internas/administrativas, e confrontando
   * com os registros da tabela `page` no banco de dados.
   */
  async getTopPages(
    range: 'day' | 'week' | 'month' | 'year' | 'all' = 'week',
    initDate?: string,
    finalDate?: string,
    limit = 5,
  ): Promise<TopPageItem[]> {
    const now = Date.now();
    let startAt: number;

    if (initDate && !isNaN(new Date(initDate).getTime())) {
      startAt = new Date(initDate).getTime();
    } else {
      switch (range) {
        case 'day':
          startAt = now - 24 * 60 * 60 * 1000;
          break;
        case 'week':
          startAt = now - 7 * 24 * 60 * 60 * 1000;
          break;
        case 'month':
          startAt = now - 30 * 24 * 60 * 60 * 1000;
          break;
        case 'year':
          startAt = now - 365 * 24 * 60 * 60 * 1000;
          break;
        case 'all':
          startAt = 0;
          break;
        default:
          startAt = now - 7 * 24 * 60 * 60 * 1000;
          break;
      }
    }

    const endAt =
      finalDate && !isNaN(new Date(finalDate).getTime())
        ? new Date(finalDate).getTime()
        : now;

    const expandedUrl = `${process.env.UMAMI_API_URL}/api/websites/${process.env.UMAMI_WEBSITE_ID}/metrics/expanded?type=path&startAt=${startAt}&endAt=${endAt}&limit=500`;
    const standardUrl = `${process.env.UMAMI_API_URL}/api/websites/${process.env.UMAMI_WEBSITE_ID}/metrics?type=path&startAt=${startAt}&endAt=${endAt}&limit=500`;

    try {
      let token = await this.getAuthToken();

      let response = await fetch(expandedUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        token = await this.getAuthToken(true);
        response = await fetch(expandedUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      if (!response.ok && response.status === 404) {
        response = await fetch(standardUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      if (!response.ok) {
        throw new Error(
          `Umami API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      // Agrupa visualizações e visitantes por caminho limpo
      const viewsByPath = new Map<
        string,
        { views: number; visitors: number; slug: string }
      >();

      if (Array.isArray(data)) {
        for (const item of data) {
          const rawPath = item?.name || item?.x;
          if (!rawPath || typeof rawPath !== 'string') continue;

          // Limpa query params e hashes
          const cleanPath = rawPath.split('?')[0].split('#')[0].trim();
          if (!cleanPath) continue;

          // Normaliza path para começar com /
          const normalizedPath = cleanPath.startsWith('/')
            ? cleanPath
            : `/${cleanPath}`;

          // Exclui a página inicial (/ ou /home)
          if (normalizedPath === '/' || normalizedPath === '/home') {
            continue;
          }

          // Exclui notícias
          if (
            normalizedPath.startsWith('/noticias') ||
            normalizedPath.startsWith('/noticia')
          ) {
            continue;
          }

          // Exclui rotas administrativas e internas do sistema
          if (
            normalizedPath.startsWith('/administrator') ||
            normalizedPath === '/login' ||
            normalizedPath.startsWith('/login/') ||
            normalizedPath === '/error' ||
            normalizedPath.startsWith('/api') ||
            normalizedPath.startsWith('/_next')
          ) {
            continue;
          }

          // Extrai o slug da página
          const slug = normalizedPath.replace(/^\/+|\/+$/g, '');
          if (!slug || slug === 'home') {
            continue;
          }

          const pageviews = Number(item.pageviews) || Number(item.y) || 0;
          const visitors = Number(item.visitors) || Number(item.y) || 0;

          const current = viewsByPath.get(normalizedPath) || {
            views: 0,
            visitors: 0,
            slug,
          };

          viewsByPath.set(normalizedPath, {
            views: current.views + pageviews,
            visitors: current.visitors + visitors,
            slug,
          });
        }
      }

      // Ordena por visualizações de forma decrescente
      const sortedEntries = Array.from(viewsByPath.entries())
        .sort((a, b) => b[1].views - a[1].views)
        .slice(0, limit);

      if (sortedEntries.length === 0) {
        return [];
      }

      // Slugs para buscar na tabela page
      const slugsToQuery = sortedEntries.map(([_, v]) => v.slug);

      // Consulta no banco de dados para confrontar com a tabela page
      const pages = await this.prisma.page.findMany({
        where: {
          slug: { in: slugsToQuery },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          updatedAt: true,
          space: {
            select: {
              slug: true,
            },
          },
        },
      });

      // Mapeia páginas por slug e também por space/slug
      const pageMap = new Map<string, any>();
      for (const page of pages) {
        pageMap.set(page.slug, page);
        if (page.space?.slug) {
          pageMap.set(`${page.space.slug}/${page.slug}`, page);
        }
      }

      return sortedEntries.map(([path, metrics]) => {
        const page = pageMap.get(metrics.slug);

        const title =
          page?.title ||
          metrics.slug
            .split('/')
            .pop()!
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());

        return {
          id: page?.id || null,
          title,
          path,
          slug: metrics.slug,
          views: metrics.views,
          visitors: metrics.visitors,
          updatedAt: page?.updatedAt || null,
        };
      });
    } catch (error) {
      console.error('Erro ao buscar top pages do Umami:', error);
      throw new InternalServerErrorException(
        'Não foi possível carregar as páginas mais visitadas.',
      );
    }
  }
}
