import { ICreateMenu, IMenu, IMenuItem } from "../type/menu";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class MenusService {
  static async getAll() {
    const url = `${API_URL}/menus`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Erro ao buscar o menu");
    }
    return response.json();
  }

  static async getAllSubItems() {
    const url = `${API_URL}/menus/subitems`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Erro ao buscar os itens do menu");
    }
    return response.json();
  }

  static async getMenuByLocation(
    location: string,
    entityId: string,
  ): Promise<IMenu> {
    const url = `${API_URL}/menus/location/${location}?entityId=${entityId}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Erro ao buscar o menu");
    }
    return response.json();
  }
  static async createMenu(data: ICreateMenu): Promise<IMenu> {
    const url = `${API_URL}/menus`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Erro ao criar o menu");
    }
    return response.json();
  }
  static async syncMenuItems(
    menuId: string,
    items: IMenuItem[],
  ): Promise<any[]> {
    const url = `${API_URL}/menus/${menuId}/items`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(items),
    });
    if (!response.ok) {
      throw new Error("Erro ao sincronizar os itens de menu");
    }
    return response.json();
  }
}
