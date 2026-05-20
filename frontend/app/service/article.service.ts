import { IArticle } from "../type/article";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class ArticleService {
  static async getArticles(): Promise<IArticle[]> {
    const response = await fetch(`${API_URL}/articles`, {
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

  static async getArticle(id: string): Promise<IArticle> {
    const response = await fetch(`${API_URL}/articles/${id}`, {
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

  static async updateArticle(id: string, data: Partial<IArticle>): Promise<IArticle> {
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
