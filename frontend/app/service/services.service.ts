import { IServices } from "../type/services";
import { csrfFetch } from "@/lib/csrf";

const API_URL = process.env.NEXT_PUBLIC_API_URL + "/services";

export class ServicesService {
  static async getServicesList(params?: {
    page?: number;
    limit?: number;
    title?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.title) query.append("title", params.title);
    const url = `${API_URL}?${query.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao buscar serviços");
    return response.json();
  }

  static async getPublicServicesList(params?: {
    page?: number;
    limit?: number;
    title?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.title) query.append("title", params.title.trim());

    // ✅ Aponta para a nova rota pública
    const url = `${API_URL}/public?${query.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      // Removi o credentials: "include", pois é público
    });
    if (!response.ok) throw new Error("Erro ao buscar serviços");
    return response.json();
  }

  static async getServiceById(id: string) {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao buscar serviço");
    return response.json();
  }

  static async createService(service: Partial<IServices>) {
    const response = await csrfFetch(`${API_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(service),
    });
    if (!response.ok) throw new Error("Erro ao criar serviço");
    return response.json();
  }

  static async updateService(id: string, service: Partial<IServices>) {
    const response = await csrfFetch(`${API_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(service),
    });
    if (!response.ok) throw new Error("Erro ao atualizar serviço");
    return response.json();
  }

  static async deleteService(id: string) {
    const response = await csrfFetch(`${API_URL}/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao deletar serviço");
    return response.json();
  }

  static async approveService(id: string) {
    const response = await csrfFetch(`${API_URL}/${id}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao aprovar serviço");
    return response.json();
  }

  static async rejectService(id: string, reason?: string) {
    const response = await csrfFetch(`${API_URL}/${id}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error("Erro ao rejeitar serviço");
    return response.json();
  }
}
