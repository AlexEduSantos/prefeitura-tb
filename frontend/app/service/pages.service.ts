import { IPage } from "../type/pages";
import { csrfFetch } from "@/lib/csrf";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class PagesService {
  static async getPagesList(
    page: number = 1,
    limit: number = 50,
    sort: string = "desc",
  ) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sort,
    });
    const url = `${API_URL}/pages?${params.toString()}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar páginas");
    }

    return response.json();
  }

  static async getPublicPages(search?: string) {
    const params = new URLSearchParams();
    if (search && search.trim()) {
      params.append("search", search.trim());
    }
    const queryString = params.toString() ? `?${params.toString()}` : "";
    const url = `${API_URL}/pages/public${queryString}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar páginas");
    }

    return response.json();
  }

  static async getPage(id: string) {
    const response = await fetch(`${API_URL}/pages/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar página");
    }

    return response.json();
  }

  static async savePage(data: Record<string, unknown> | Partial<IPage>) {
    const response = await csrfFetch(`${API_URL}/pages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Erro ao salvar página");
    }

    return response.json();
  }

  static async updatePage(
    id: string,
    data: Record<string, unknown> | Partial<IPage>,
  ) {
    if (!id || id.trim() === "") {
      throw new Error("ID da página é obrigatório para atualização.");
    }

    const response = await csrfFetch(`${API_URL}/pages/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Erro ao atualizar página");
    }

    return response.json();
  }

  static async deletePage(id: string) {
    const response = await csrfFetch(`${API_URL}/pages/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao deletar página");
    }

    return response.json();
  }

  static async changePublishedPage(
    id: string,
    published: boolean,
  ): Promise<IPage> {
    const response = await csrfFetch(`${API_URL}/pages/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ published }),
    });

    if (!response.ok) {
      throw new Error("Erro ao publicar página");
    }

    return response.json();
  }

  static async getPublicRootPage(slug: string): Promise<IPage> {
    const response = await fetch(`${API_URL}/pages/public/root/${slug}`, {
      headers: { "Content-Type": "application/json" },
      // ⚠️ NÃO mandar credentials: "include" aqui
    });

    if (response.status === 404) {
      throw new Error("NOT_FOUND");
    }
    if (!response.ok) {
      throw new Error("Erro ao buscar página");
    }

    return response.json();
  }

  static async getPublicSpacePage(
    spaceSlug: string,
    slug: string,
  ): Promise<IPage> {
    const response = await fetch(
      `${API_URL}/pages/public/${spaceSlug}/${slug}`,
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    if (response.status === 404) {
      throw new Error("NOT_FOUND");
    }
    if (!response.ok) {
      throw new Error("Erro ao buscar página");
    }

    return response.json();
  }

  static async approvePage(id: string): Promise<IPage> {
    const response = await csrfFetch(`${API_URL}/pages/${id}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Erro ao aprovar página");
    }
    return response.json();
  }

  static async rejectPage(id: string): Promise<IPage> {
    const response = await csrfFetch(`${API_URL}/pages/${id}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Erro ao rejeitar página");
    }
    return response.json();
  }
}
