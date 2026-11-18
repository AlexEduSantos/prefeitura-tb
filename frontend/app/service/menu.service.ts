import { IMenu, IMenuItem } from "../type/menu";
import { csrfFetch } from "@/lib/csrf";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class MenuService {
  static async getMenus(): Promise<IMenu[]> {
    const response = await fetch(`${API_URL}/menus`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao buscar menus");
    return response.json();
  }

  static async getMenu(id: string): Promise<IMenu> {
    const response = await fetch(`${API_URL}/menus/${id}`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao buscar menu");
    return response.json();
  }

  static async getMenuByField({
    field,
    value,
  }: {
    field: "spaceId" | "organizationId" | "location" | "title" | "id" | "active";
    value: string;
  }): Promise<IMenu[]> {
    const response = await fetch(
      `${API_URL}/menus/by/${encodeURIComponent(field)}/${encodeURIComponent(value)}`,
      {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );
    if (!response.ok) throw new Error("Erro ao buscar menu");
    return response.json();
  }

  static async createMenu(data: Partial<IMenu>): Promise<IMenu> {
    const response = await csrfFetch(`${API_URL}/menus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Erro ao criar menu");
    return response.json();
  }

  static async updateMenu(id: string, data: Partial<IMenu>): Promise<IMenu> {
    const response = await csrfFetch(`${API_URL}/menus/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Erro ao atualizar menu");
    return response.json();
  }

  static async deleteMenu(id: string): Promise<IMenu> {
    const response = await csrfFetch(`${API_URL}/menus/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao remover menu");
    return response.json();
  }
}

export class MenuItemService {
  static async getMenuItems(): Promise<IMenuItem[]> {
    const response = await fetch(`${API_URL}/menu-item`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao buscar itens do menu");
    return response.json();
  }

  static async getMenuItem(id: string): Promise<IMenuItem> {
    const response = await fetch(`${API_URL}/menu-item/${id}`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao buscar item do menu");
    return response.json();
  }

  static async reorderMenuItems(
    data: Partial<IMenuItem>[],
  ): Promise<IMenuItem[]> {
    const response = await csrfFetch(`${API_URL}/menu-item/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Erro ao reordenar itens do menu");
    return response.json();
  }

  static async createMenuItem(
    data: Partial<IMenuItem>,
    menuId: string,
  ): Promise<IMenuItem> {
    const response = await csrfFetch(`${API_URL}/menu-item/create/${menuId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Erro ao criar item do menu");
    return response.json();
  }

  static async updateMenuItem(
    id: string,
    data: Partial<IMenuItem>,
  ): Promise<IMenuItem> {
    const response = await csrfFetch(`${API_URL}/menu-item/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Erro ao atualizar item do menu");
    return response.json();
  }

  static async deleteMenuItem(id: string): Promise<IMenuItem> {
    const response = await csrfFetch(`${API_URL}/menu-item/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao remover item do menu");
    return response.json();
  }
}
