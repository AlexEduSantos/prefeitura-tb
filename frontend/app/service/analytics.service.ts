import { IPageViews } from "../type/analytics";

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
        credentials: "include", // Mantenha se a rota for protegida
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
}
