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

  static async uploadMedia(file: File, metadata: { title: string; alt_text?: string; description?: string }): Promise<IMedia> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", metadata.title);
    if (metadata.alt_text) formData.append("alt_text", metadata.alt_text);
    if (metadata.description) formData.append("description", metadata.description);

    let endpoint = "document";
    if (file.type.startsWith("image/")) {
      endpoint = "image";
    } else if (file.type.startsWith("video/")) {
      endpoint = "video";
    }

    formData.append("type", endpoint);

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
}
