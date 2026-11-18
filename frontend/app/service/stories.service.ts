import { IStories, IStoriesItem } from "../type/stories";
import { csrfFetch } from "@/lib/csrf";

const API_URL = process.env.NEXT_PUBLIC_API_URL + "/story";

export class StoriesService {
  static async getAdminStoriesList(params?: {
    page?: number;
    limit?: number;
    title?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.title) query.append("title", params.title);
    const url = `${API_URL}/admin?${query.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao buscar destaques administrativos");
    return response.json();
  }

  static async getStoriesList(params?: {
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
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao buscar destaques");
    return response.json();
  }

  static async getStoriesById(id: string) {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao buscar destaque");
    return response.json();
  }

  static async createStories(story: Partial<IStories>) {
    const response = await csrfFetch(`${API_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(story),
    });
    if (!response.ok) throw new Error("Erro ao criar destaque");
    return response.json();
  }

  static async updateStories(id: string, story: Partial<IStories>) {
    const response = await csrfFetch(`${API_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(story),
    });
    if (!response.ok) throw new Error("Erro ao atualizar destaque");
    return response.json();
  }

  static async deleteStories(id: string) {
    const response = await csrfFetch(`${API_URL}/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao deletar destaque");
    return response.json();
  }

  // ----- Story Items -----

  static async getStoriesItemsList() {
    const response = await fetch(`${API_URL}/items`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao buscar itens");
    return response.json();
  }

  static async getStoriesItemById(id: string) {
    const response = await fetch(`${API_URL}/items/${id}`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao buscar item");
    return response.json();
  }

  static async getStoriesItemsByStoryId(storyId: string) {
    const response = await fetch(`${API_URL}/${storyId}/items`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao buscar itens do destaque");
    return response.json();
  }

  static async createStoriesItem(storyId: string, item: Partial<IStoriesItem>) {
    const response = await csrfFetch(`${API_URL}/${storyId}/item`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error("Erro ao criar item");
    return response.json();
  }

  static async updateStoriesItem(id: string, item: Partial<IStoriesItem>) {
    const response = await csrfFetch(`${API_URL}/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error("Erro ao atualizar item");
    return response.json();
  }

  static async updateOrderStoriesItems(ids: string[]) {
    const response = await csrfFetch(`${API_URL}/items/order`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) {
      let message = "Erro ao atualizar ordem";
      try {
        const errData = await response.json();
        message = errData.message || message;
      } catch {}
      throw new Error(message);
    }
    return response.json();
  }

  static async deleteStoriesItem(id: string) {
    const response = await csrfFetch(`${API_URL}/items/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao deletar item");
    return response.json();
  }
}
