import { IPageViews, ITopNewsItem, TopNewsRange } from "../type/analytics";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class AnalyticsService {
  static async getAnalytics(data: { initDate?: string; finalDate?: string }) {
    const params = new URLSearchParams();
    if (data.initDate) params.append("initDate", data.initDate);
    if (data.finalDate) params.append("finalDate", data.finalDate);

    const response = await fetch(
      `${API_URL}/analytics/summary?${params.toString()}`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error("Erro ao buscar estatísticas");
    }

    return response.json();
  }

  static async getPageViews(data: {
    initDate?: string;
    finalDate?: string;
    unit: "day" | "month" | "year" | "hour";
  }): Promise<IPageViews> {
    const params = new URLSearchParams();
    if (data.initDate) params.append("initDate", data.initDate);
    if (data.finalDate) params.append("finalDate", data.finalDate);
    if (data.unit) params.append("unit", data.unit);

    const response = await fetch(
      `${API_URL}/analytics/pageviews?${params.toString()}`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error("Erro ao buscar estatísticas");
    }

    return response.json();
  }

  static async getTopNews(params?: {
    range?: TopNewsRange;
    initDate?: string;
    finalDate?: string;
    limit?: number;
  }): Promise<ITopNewsItem[]> {
    const searchParams = new URLSearchParams();
    if (params?.range) searchParams.append("range", params.range);
    if (params?.initDate) searchParams.append("initDate", params.initDate);
    if (params?.finalDate) searchParams.append("finalDate", params.finalDate);
    if (params?.limit) searchParams.append("limit", params.limit.toString());

    const response = await fetch(
      `${API_URL}/analytics/top-news?${searchParams.toString()}`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error("Erro ao buscar notícias mais visualizadas");
    }

    return response.json();
  }
}
