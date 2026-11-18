import { IPopups } from "../type/popup";
import { csrfFetch } from "@/lib/csrf";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class PopupsService {
  static async getPublicPopupsList(): Promise<IPopups[]> {
    const response = await fetch(`${API_URL}/popups`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar popups públicos");
    }

    return response.json();
  }

  static async getPopupsList(): Promise<IPopups[]> {
    const response = await fetch(`${API_URL}/popups/admin`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar popups");
    }

    return response.json();
  }

  static async getPopupsById(id: string): Promise<IPopups> {
    const response = await fetch(`${API_URL}/popups/admin/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar popups");
    }

    return response.json();
  }

  private static sanitizePopupPayload(popup: Partial<IPopups>) {
    const {
      id: _id,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      image: _image,
      user: _user,
      organization: _organization,
      space: _space,
      ...allowed
    } = popup as Record<string, unknown>;
    return allowed;
  }

  static async createPopups(popup: Partial<IPopups>): Promise<IPopups> {
    const payload = this.sanitizePopupPayload(popup);
    const response = await csrfFetch(`${API_URL}/popups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Erro ao criar popup");
    }

    return response.json();
  }

  static async updatePopups(
    id: string,
    popup: Partial<IPopups>,
  ): Promise<IPopups> {
    const payload = this.sanitizePopupPayload(popup);
    const response = await csrfFetch(`${API_URL}/popups/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Erro ao atualizar popup");
    }

    return response.json();
  }

  static async deletePopups(id: string): Promise<IPopups> {
    const response = await csrfFetch(`${API_URL}/popups/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao deletar popup");
    }

    return response.json();
  }

  static async approvePopup(id: string): Promise<IPopups> {
    const response = await csrfFetch(`${API_URL}/popups/${id}/approve`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Erro ao aprovar popup");
    }
    return response.json();
  }

  static async rejectPopup(id: string, reason?: string): Promise<IPopups> {
    const response = await csrfFetch(`${API_URL}/popups/${id}/reject`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      throw new Error("Erro ao rejeitar popup");
    }
    return response.json();
  }
}
