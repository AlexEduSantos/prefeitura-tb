import { IAuditFilterParams, IAuditLog, IAuditLogsResponse } from "../type/audit";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class AuditService {
  static async getAuditLogs(params: IAuditFilterParams = {}): Promise<IAuditLogsResponse> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append("page", String(params.page));
    if (params.limit) searchParams.append("limit", String(params.limit));
    if (params.action && params.action !== "all") searchParams.append("action", params.action);
    if (params.entity && params.entity !== "all") searchParams.append("entity", params.entity);
    if (params.userId) searchParams.append("userId", params.userId);
    if (params.search?.trim()) searchParams.append("search", params.search.trim());
    if (params.startDate) searchParams.append("startDate", params.startDate);
    if (params.endDate) searchParams.append("endDate", params.endDate);

    const queryString = searchParams.toString();
    const url = queryString
      ? `${API_URL}/audit-logs?${queryString}`
      : `${API_URL}/audit-logs`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      const msg = Array.isArray(errBody?.message)
        ? errBody.message.join(", ")
        : errBody?.message;
      throw new Error(msg || "Erro ao carregar logs de auditoria");
    }

    return res.json();
  }

  static async getAuditLogById(id: string): Promise<IAuditLog> {
    const res = await fetch(`${API_URL}/audit-logs/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Erro ao buscar detalhes do log");
    }

    return res.json();
  }
}

