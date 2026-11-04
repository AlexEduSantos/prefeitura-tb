import { Injectable, InternalServerErrorException } from '@nestjs/common';

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

@Injectable()
export class AnalyticsService {
  private token: string | null = null;

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
    const startAt = initDate
      ? new Date(initDate).getTime()
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime();
    const endAt = finalDate ? new Date(finalDate).getTime() : Date.now();

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
    const startAt = initDate
      ? new Date(initDate).getTime()
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime();
    const endAt = finalDate ? new Date(finalDate).getTime() : Date.now();

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
}
