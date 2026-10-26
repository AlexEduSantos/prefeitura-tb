import { IPage } from "../type/page";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class PagesService {
  static async getPagesList(page?: number, limit?: number, sort?: string) {
    const url = `${API_URL}/pages?page=${page}&limit=${limit}&sort=${sort}`;
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

  static async savePage(data: any) {
    const response = await fetch(`${API_URL}/pages`, {
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

  static async updatePage(id: string, data: any) {
    if (!id || id.trim() === "") {
      throw new Error("ID da página é obrigatório para atualização.");
    }

    const response = await fetch(`${API_URL}/pages/${id}`, {
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
    const response = await fetch(`${API_URL}/pages/${id}`, {
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
    const response = await fetch(`${API_URL}/pages/${id}`, {
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
}
