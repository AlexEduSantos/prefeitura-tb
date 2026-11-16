import { IArticle } from "../type/article";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class ArticleService {
  /**
   * Busca artigos para o painel administrativo:
   * Retorna todos os artigos menos os excluídos por padrão (ou filtra por status específico).
   */
  static async getAdminArticles(
    search?: string,
    status?: string
  ): Promise<IArticle[]> {
    const params = new URLSearchParams();
    if (search && search.trim()) {
      params.append("search", search.trim());
    }
    if (status && status.trim()) {
      params.append("status", status.trim());
    }
    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`${API_URL}/articles/admin${queryString}`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar artigos administrativos");
    }

    return response.json();
  }

  /**
   * Busca pública de artigos:
   * Retorna apenas artigos com status 'publicado' e vigentes.
   */
  static async getArticles(
    searchOrFilters?:
      | string
      | {
          search?: string;
          category?: string;
          organizationId?: string;
          type?: string;
          authorId?: string;
          startDate?: string;
          endDate?: string;
          sortBy?: string;
          sortOrder?: "asc" | "desc";
        }
  ): Promise<IArticle[]> {
    const params = new URLSearchParams();
    if (typeof searchOrFilters === "string") {
      if (searchOrFilters.trim()) {
        params.append("search", searchOrFilters.trim());
      }
    } else if (searchOrFilters && typeof searchOrFilters === "object") {
      Object.entries(searchOrFilters).forEach(([key, value]) => {
        if (value && String(value).trim()) {
          params.append(key, String(value).trim());
        }
      });
    }
    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`${API_URL}/articles${queryString}`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar artigos");
    }

    return response.json();
  }

  static async getArticle(slug: string): Promise<IArticle> {
    const response = await fetch(`${API_URL}/articles/${slug}`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar artigo");
    }

    return response.json();
  }

  static async getArticleById(id: string): Promise<IArticle> {
    const response = await fetch(`${API_URL}/articles/id/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar artigo");
    }

    return response.json();
  }

  static async createArticle(data: Partial<IArticle>): Promise<IArticle> {
    const response = await fetch(`${API_URL}/articles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Erro ao criar artigo");
    }

    return response.json();
  }

  static async updateArticle(
    id: string,
    data: Partial<IArticle>,
  ): Promise<IArticle> {
    const response = await fetch(`${API_URL}/articles/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Erro ao atualizar artigo");
    }

    return response.json();
  }

  static async changeStatus(id: string, status: string): Promise<IArticle> {
    const response = await fetch(`${API_URL}/articles/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error("Erro ao atualizar status do artigo");
    }

    return response.json();
  }

  static async changeFeatured(
    id: string,
    featured: boolean,
  ): Promise<IArticle> {
    const response = await fetch(`${API_URL}/articles/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ featured }),
    });

    if (!response.ok) {
      throw new Error("Erro ao atualizar destaque do artigo");
    }

    return response.json();
  }

  static async deleteArticle(id: string): Promise<IArticle> {
    const response = await fetch(`${API_URL}/articles/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao deletar artigo");
    }

    return response.json();
  }
}
