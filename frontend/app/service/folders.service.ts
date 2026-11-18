import { csrfFetch } from "@/lib/csrf";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class FoldersService {
  static async createFolder(name: string, parentId?: string) {
    const response = await csrfFetch(`${API_URL}/media/folders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ name, parentId }),
    });

    if (!response.ok) {
      throw new Error("Erro ao criar pasta");
    }

    return response.json();
  }

  static async renameFolder(id: string, name: string) {
    const response = await csrfFetch(`${API_URL}/media/folders/${id}/rename`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      throw new Error("Erro ao renomear pasta");
    }

    return response.json();
  }

  static async moveFolder(id: string, parentId: string | null) {
    const response = await csrfFetch(`${API_URL}/media/folders/${id}/move`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ parentId }),
    });

    if (!response.ok) {
      throw new Error("Erro ao mover pasta");
    }

    return response.json();
  }

  static async deleteFolder(id: string) {
    const response = await csrfFetch(`${API_URL}/media/folders/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao deletar pasta");
    }

    return response.json();
  }
}
