import { IPopups } from "../type/popup";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class PopupsService {
  static async getPopupsList(): Promise<IPopups[]> {
    const response = await fetch(`${API_URL}/popups`, {
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
    const response = await fetch(`${API_URL}/popups/${id}`, {
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

  static async createPopups(popup: Partial<IPopups>): Promise<IPopups> {
    const response = await fetch(`${API_URL}/popups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(popup),
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
    const response = await fetch(`${API_URL}/popups/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(popup),
    });

    if (!response.ok) {
      throw new Error("Erro ao atualizar popup");
    }

    return response.json();
  }

  static async deletePopups(id: string): Promise<IPopups> {
    const response = await fetch(`${API_URL}/popups/${id}`, {
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
}
