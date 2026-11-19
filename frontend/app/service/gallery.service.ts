import { IGallery } from "../type/gallery";
import { csrfFetch } from "@/lib/csrf";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class GalleryService {
  private static sanitizePayload(gallery: Partial<IGallery>) {
    const payload: Record<string, unknown> = {};
    if (gallery.title !== undefined) payload.title = gallery.title;
    if (gallery.active !== undefined) payload.active = Boolean(gallery.active);
    if (
      typeof gallery.organizationId === "string" &&
      gallery.organizationId.trim()
    ) {
      payload.organizationId = gallery.organizationId.trim();
    }
    if (typeof gallery.spaceId === "string" && gallery.spaceId.trim()) {
      payload.spaceId = gallery.spaceId.trim();
    }
    if (Array.isArray(gallery.slides)) {
      payload.slides = gallery.slides.map((s, idx) => ({
        mediaId: s.mediaId,
        order: typeof s.order === "number" ? s.order : idx + 1,
        ...(s.caption !== undefined && s.caption !== null
          ? { caption: s.caption }
          : {}),
        ...(s.link !== undefined && s.link !== null ? { link: s.link } : {}),
      }));
    }
    return payload;
  }

  private static async parseErrorMessage(
    response: Response,
    fallback: string,
  ): Promise<string> {
    const body = await response.json().catch(() => null);
    if (Array.isArray(body?.message)) return body.message.join(", ");
    if (typeof body?.message === "string" && body.message.trim()) {
      return body.message;
    }
    return fallback;
  }

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
      body: JSON.stringify(this.sanitizePayload(gallery)),
    });

    if (!response.ok) {
      throw new Error(
        await this.parseErrorMessage(response, "Erro ao criar galeria"),
      );
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
      body: JSON.stringify(this.sanitizePayload(banner)),
    });

    if (!response.ok) {
      throw new Error(
        await this.parseErrorMessage(response, "Erro ao atualizar galeria"),
      );
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
      throw new Error(
        await this.parseErrorMessage(response, "Erro ao deletar galeria"),
      );
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
