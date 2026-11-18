import { csrfFetch } from "@/lib/csrf";
import { IApprovalListResponse, IContentChangeRequest } from "../type/approval";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function extractErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(payload?.message)) {
      return payload.message.join(", ");
    }
    if (typeof payload?.message === "string" && payload.message.trim()) {
      return payload.message;
    }
  } catch {
    // fallback silencioso
  }
  return fallback;
}

export class ApprovalService {
  static async getRequests(params?: {
    status?: string;
    entityType?: string;
    page?: number;
    limit?: number;
  }): Promise<IApprovalListResponse> {
    const search = new URLSearchParams();
    if (params?.status) search.append("status", params.status);
    if (params?.entityType) search.append("entityType", params.entityType);
    if (params?.page) search.append("page", String(params.page));
    if (params?.limit) search.append("limit", String(params.limit));

    const query = search.toString() ? `?${search.toString()}` : "";
    const response = await fetch(`${API_URL}/approvals${query}`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(
        await extractErrorMessage(response, "Erro ao buscar fila de aprovações"),
      );
    }

    return response.json();
  }

  static async getRequestById(id: string): Promise<IContentChangeRequest> {
    const response = await fetch(`${API_URL}/approvals/${id}`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(
        await extractErrorMessage(response, "Erro ao buscar solicitação"),
      );
    }

    return response.json();
  }

  static async updateProposedData(
    id: string,
    proposedData: Record<string, unknown>,
  ): Promise<IContentChangeRequest> {
    const response = await csrfFetch(`${API_URL}/approvals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ proposedData }),
    });

    if (!response.ok) {
      throw new Error(
        await extractErrorMessage(response, "Erro ao atualizar proposta"),
      );
    }

    return response.json();
  }

  static async approveRequest(
    id: string,
    proposedData?: Record<string, unknown>,
  ): Promise<{
    request: IContentChangeRequest;
    entity: Record<string, unknown>;
  }> {
    const response = await csrfFetch(`${API_URL}/approvals/${id}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(proposedData ? { proposedData } : {}),
    });

    if (!response.ok) {
      throw new Error(
        await extractErrorMessage(response, "Erro ao aprovar solicitação"),
      );
    }

    return response.json();
  }

  static async rejectRequest(
    id: string,
    reason?: string,
  ): Promise<IContentChangeRequest> {
    const response = await csrfFetch(`${API_URL}/approvals/${id}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      throw new Error(
        await extractErrorMessage(response, "Erro ao rejeitar solicitação"),
      );
    }

    return response.json();
  }

  static async cancelRequest(id: string): Promise<IContentChangeRequest> {
    const response = await csrfFetch(`${API_URL}/approvals/${id}/cancel`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(
        await extractErrorMessage(response, "Erro ao cancelar solicitação"),
      );
    }

    return response.json();
  }

  static async resubmitRequest(
    id: string,
    proposedData: Record<string, unknown>,
  ): Promise<IContentChangeRequest> {
    const response = await csrfFetch(`${API_URL}/approvals/${id}/resubmit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ proposedData }),
    });

    if (!response.ok) {
      throw new Error(
        await extractErrorMessage(response, "Erro ao reenviar solicitação"),
      );
    }

    return response.json();
  }
}
