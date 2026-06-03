import { IMedia } from "../type/media";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class MediaService {
  static async getMediaList(): Promise<IMedia[]> {
    const response = await fetch(`${API_URL}/media`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar mídias");
    }

    return response.json();
  }

  static async updateMedia(metadata: {
    title: string;
    alt_text?: string;
    description?: string;
    id: string;
    tags?: string[];
  }) {
    const response = await fetch(`${API_URL}/media/${metadata.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      throw new Error("Erro ao atualizar mídia");
    }

    return response.json();
  }

  static async uploadMedia(
    file: File,
    metadata: { title: string; alt_text?: string; description?: string; folderId?: string },
  ): Promise<IMedia> {
    const formData = new FormData();
    formData.append("title", metadata.title);
    if (metadata.alt_text) formData.append("alt_text", metadata.alt_text);
    if (metadata.description)
      formData.append("description", metadata.description);
    if (metadata.folderId)
      formData.append("folderId", metadata.folderId);

    let endpoint = "document";
    if (file.type.startsWith("image/")) {
      endpoint = "image";
    } else if (file.type.startsWith("video/")) {
      endpoint = "video";
    }

    formData.append("type", endpoint);
    formData.append("file", file);

    const response = await fetch(`${API_URL}/media/${endpoint}`, {
      method: "POST",
      credentials: "include",
      // Não defina Content-Type para FormData, o navegador fará isso automaticamente com o boundary
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Erro ao enviar mídia");
    }

    return response.json();
  }

  static async deleteMedia(id: string): Promise<IMedia> {
    const response = await fetch(`${API_URL}/media/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao deletar mídia");
    }

    return response.json();
  }

  static async createFolder(name: string, parentId?: string) {
    const response = await fetch(`${API_URL}/media/folders`, {
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
    const response = await fetch(`${API_URL}/media/folders/${id}/rename`, {
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
    const response = await fetch(`${API_URL}/media/folders/${id}/move`, {
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
    const response = await fetch(`${API_URL}/media/folders/${id}`, {
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

  static async listMediaByPrefix(
    prefix: string,
    page: number,
    sort: string,
    limit: number,
  ) {
    const url = `${API_URL}/media/list/${prefix}?page=${page}&limit=${limit}&sort=${sort}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar mídias");
    }

    return response.json();
  }
}
