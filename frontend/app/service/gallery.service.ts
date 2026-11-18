import { IGallery } from "../type/gallery";
import { csrfFetch } from "@/lib/csrf";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class GalleryService {
  static async getGalleryList(): Promise<IGallery[]> {
    const response = await fetch(`${API_URL}/galleries`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar galeria");
    }

    return response.json();
  }

  static async getAdminGalleryList(): Promise<IGallery[]> {
    const response = await fetch(`${API_URL}/galleries/admin`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar galerias administrativas");
    }

    return response.json();
  }

  static async createGallery(gallery: Partial<IGallery>): Promise<IGallery> {
    const response = await csrfFetch(`${API_URL}/galleries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(gallery),
    });

    if (!response.ok) {
      throw new Error("Erro ao criar galeria");
    }

    return response.json();
  }

  static async updateGallery(banner: IGallery): Promise<IGallery> {
    const response = await csrfFetch(`${API_URL}/galleries/${banner.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(banner),
    });

    if (!response.ok) {
      throw new Error("Erro ao atualizar galeria");
    }

    return response.json();
  }

  static async deleteGallery(id: string): Promise<IGallery> {
    const response = await csrfFetch(`${API_URL}/galleries/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao deletar galeria");
    }

    return response.json();
  }

  static async approveGallery(id: string): Promise<IGallery> {
    const response = await csrfFetch(`${API_URL}/galleries/${id}/approve`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao aprovar galeria");
    }

    return response.json();
  }

  static async rejectGallery(id: string, reason?: string): Promise<IGallery> {
    const response = await csrfFetch(`${API_URL}/galleries/${id}/reject`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      throw new Error("Erro ao rejeitar galeria");
    }

    return response.json();
  }
}
