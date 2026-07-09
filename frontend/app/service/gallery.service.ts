import { IGallery } from "../type/gallery";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class GalleryService {
  static async getGalleryList(): Promise<IGallery[]> {
    const response = await fetch(`${API_URL}/banners`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar banners");
    }

    return response.json();
  }

  static async createGallery(banner: Partial<IGallery>): Promise<IGallery> {
    const response = await fetch(`${API_URL}/banners`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(banner),
    });

    if (!response.ok) {
      throw new Error("Erro ao criar banner");
    }

    return response.json();
  }

  static async updateGallery(banner: IGallery): Promise<IGallery> {
    const response = await fetch(`${API_URL}/banners/${banner.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(banner),
    });

    if (!response.ok) {
      throw new Error("Erro ao atualizar banner");
    }

    return response.json();
  }

  static async deleteGallery(id: string): Promise<IGallery> {
    const response = await fetch(`${API_URL}/banners/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao deletar banner");
    }

    return response.json();
  }
}
