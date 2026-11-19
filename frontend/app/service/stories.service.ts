import { IStories, IStoriesItem } from "../type/stories";
import { csrfFetch } from "@/lib/csrf";

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/story";

async function parseErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  const errData = await response.json().catch(() => null);
  if (Array.isArray(errData?.message)) return errData.message.join(", ");
  if (typeof errData?.message === "string" && errData.message.trim()) {
    return errData.message;
  }
  return fallback;
}

function sanitizeStoryPayload(story: Partial<IStories>) {
  const payload: Record<string, unknown> = {};
  if (typeof story.title === "string") payload.title = story.title;
  if (typeof story.description === "string") {
    payload.description = story.description;
  }
  if (typeof story.order === "number") payload.order = story.order;
  if (typeof story.coverId === "string" && story.coverId.trim()) {
    payload.coverId = story.coverId.trim();
  }
  return payload;
}

function sanitizeStoryItemPayload(item: Partial<IStoriesItem>) {
  const payload: Record<string, unknown> = {};
  if (typeof item.order === "number") payload.order = item.order;
  if (item.caption !== undefined) payload.caption = item.caption;
  if (item.link !== undefined) payload.link = item.link;
  if (typeof item.mediaId === "string" && item.mediaId.trim()) {
    payload.mediaId = item.mediaId.trim();
  }
  if (item.publishedDate) payload.publishedDate = item.publishedDate;
  if (item.expirationDate) payload.expirationDate = item.expirationDate;
  return payload;
}

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
    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(
          response,
          "Erro ao buscar destaques administrativos",
        ),
      );
    }
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
    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Erro ao buscar destaques"),
      );
    }
    return response.json();
  }

  static async getStoriesById(id: string) {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Erro ao buscar destaque"),
      );
    }
    return response.json();
  }

  static async createStories(story: Partial<IStories>) {
    const response = await csrfFetch(`${API_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(sanitizeStoryPayload(story)),
    });
    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Erro ao criar destaque"),
      );
    }
    return response.json();
  }

  static async updateStories(id: string, story: Partial<IStories>) {
    const response = await csrfFetch(`${API_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(sanitizeStoryPayload(story)),
    });
    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Erro ao atualizar destaque"),
      );
    }
    return response.json();
  }

  static async deleteStories(id: string) {
    const response = await csrfFetch(`${API_URL}/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Erro ao deletar destaque"),
      );
    }
    return response.json();
  }

  // ----- Story Items -----

  static async getStoriesItemsList() {
    const response = await fetch(`${API_URL}/items`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Erro ao buscar itens"),
      );
    }
    return response.json();
  }

  static async getStoriesItemById(id: string) {
    const response = await fetch(`${API_URL}/items/${id}`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, "Erro ao buscar item"));
    }
    return response.json();
  }

  static async getStoriesItemsByStoryId(storyId: string) {
    const response = await fetch(`${API_URL}/${storyId}/items`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Erro ao buscar itens do destaque"),
      );
    }
    return response.json();
  }

  static async createStoriesItem(storyId: string, item: Partial<IStoriesItem>) {
    const response = await csrfFetch(`${API_URL}/${storyId}/item`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(sanitizeStoryItemPayload(item)),
    });
    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, "Erro ao criar item"));
    }
    return response.json();
  }

  static async updateStoriesItem(id: string, item: Partial<IStoriesItem>) {
    const response = await csrfFetch(`${API_URL}/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(sanitizeStoryItemPayload(item)),
    });
    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Erro ao atualizar item"),
      );
    }
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
      throw new Error(
        await parseErrorMessage(response, "Erro ao atualizar ordem"),
      );
    }
    return response.json();
  }

  static async deleteStoriesItem(id: string) {
    const response = await csrfFetch(`${API_URL}/items/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Erro ao deletar item"),
      );
    }
    return response.json();
  }
}
