import {
  IOfficialGazette,
  IOfficialGazetteFilterParams,
  IOfficialGazetteResponse,
} from "../type/official-gazette";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_URL = `${API_BASE}/official-gazette`;

export class OfficialGazetteService {
  /**
   * Busca a lista administrativa com dados completos e auditoria (createdBy / updatedBy)
   */
  static async getAdminGazettes(
    params?: IOfficialGazetteFilterParams,
  ): Promise<IOfficialGazetteResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.year) query.append("year", String(params.year));
    if (params?.month) query.append("month", String(params.month));
    if (params?.edition) query.append("edition", params.edition.trim());
    if (params?.search) query.append("search", params.search.trim());
    if (params?.startDate) query.append("startDate", params.startDate);
    if (params?.endDate) query.append("endDate", params.endDate);

    const url = `${API_URL}/admin?${query.toString()}`;

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Erro ao carregar os boletins oficiais na área administrativa.");
    }

    return res.json();
  }

  /**
   * Busca pública (Portal da Transparência / Site do Município)
   */
  static async getPublicGazettes(
    params?: IOfficialGazetteFilterParams,
  ): Promise<IOfficialGazetteResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.year) query.append("year", String(params.year));
    if (params?.month) query.append("month", String(params.month));
    if (params?.edition) query.append("edition", params.edition.trim());
    if (params?.search) query.append("search", params.search.trim());
    if (params?.startDate) query.append("startDate", params.startDate);
    if (params?.endDate) query.append("endDate", params.endDate);

    const url = `${API_URL}?${query.toString()}`;

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      throw new Error("Erro ao consultar os boletins oficiais.");
    }

    return res.json();
  }

  /**
   * Busca um boletim oficial específico pelo ID
   */
  static async getGazetteById(id: string): Promise<IOfficialGazette> {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Erro ao buscar detalhes do boletim oficial.");
    }

    return res.json();
  }

  /**
   * Criação de novo boletim oficial (ADMIN e PUBLISHER)
   */
  static async createGazette(
    data: Partial<IOfficialGazette>,
  ): Promise<IOfficialGazette> {
    const res = await fetch(`${API_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.message || "Erro ao cadastrar boletim oficial.");
    }

    return res.json();
  }

  /**
   * Atualização de boletim oficial existente (ADMIN e PUBLISHER)
   */
  static async updateGazette(
    id: string,
    data: Partial<IOfficialGazette>,
  ): Promise<IOfficialGazette> {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.message || "Erro ao atualizar boletim oficial.");
    }

    return res.json();
  }

  /**
   * Exclusão permanente de boletim oficial (ADMIN e PUBLISHER)
   */
  static async deleteGazette(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.message || "Erro ao excluir boletim oficial.");
    }
  }
}

