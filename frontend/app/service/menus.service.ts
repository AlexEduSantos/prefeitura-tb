import {
  ICreateMenu,
  IMenu,
  IMenuItem,
  IPaginatedResponse,
} from "../type/menu";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class MenusService {
  // ========== MENU ==========

  // Listar menus com paginação/ordenação
  static async getAll(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: "asc" | "desc";
  }): Promise<IPaginatedResponse<IMenu>> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    const url = `${API_URL}/menus?${query.toString()}`;
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) throw new Error("Erro ao buscar menus");
    return response.json();
  }

  // Buscar um menu por ID
  static async getMenuById(id: string): Promise<IMenu> {
    const url = `${API_URL}/menus/${id}`;
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) throw new Error("Erro ao buscar menu");
    return response.json();
  }

  // Buscar menu por localização (mantido)
  static async getMenuByLocation(
    location: string,
    entityId: string,
  ): Promise<IMenu> {
    const url = `${API_URL}/menus/location/${location}?entityId=${entityId}`;
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) throw new Error("Erro ao buscar menu por localização");
    return response.json();
  }

  // Criar menu
  static async createMenu(data: ICreateMenu): Promise<IMenu> {
    const response = await fetch(`${API_URL}/menus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Erro ao criar menu");
    return response.json();
  }

  // Atualizar menu
  static async updateMenu(
    id: string,
    data: Partial<ICreateMenu>,
  ): Promise<IMenu> {
    const response = await fetch(`${API_URL}/menus/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Erro ao atualizar menu");
    return response.json();
  }

  // Deletar menu
  static async deleteMenu(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/menus/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao deletar menu");
  }

  // ========== MENU ITEMS ==========

  // Listar itens de um menu com paginação/ordenação
  static async getItems(
    menuId: string,
    params?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      order?: "asc" | "desc";
    },
  ): Promise<IPaginatedResponse<IMenuItem>> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    const url = `${API_URL}/menus/${menuId}/items?${query.toString()}`;
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) throw new Error("Erro ao buscar itens do menu");
    return response.json();
  }

  // Criar um item (individual)
  static async createItem(
    menuId: string,
    data: Partial<IMenuItem>,
  ): Promise<IMenuItem> {
    const response = await fetch(`${API_URL}/menus/${menuId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Erro ao criar item");
    return response.json();
  }

  // Atualizar um item
  static async updateItem(
    menuId: string,
    itemId: string,
    data: Partial<IMenuItem>,
  ): Promise<IMenuItem> {
    const response = await fetch(`${API_URL}/menus/${menuId}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Erro ao atualizar item");
    return response.json();
  }

  // Deletar um item
  static async deleteItem(menuId: string, itemId: string): Promise<void> {
    const response = await fetch(`${API_URL}/menus/${menuId}/items/${itemId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao deletar item");
  }

  // Listar todos os subitems (se ainda usado) com paginação
  static async getAllMenuItems() {
    const url = `${API_URL}/menus/menuItems/all`;
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) throw new Error("Erro ao buscar os items desse menu");
    return response.json();
  }
}
