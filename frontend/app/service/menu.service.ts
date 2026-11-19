import { IMenu, IMenuItem } from "../type/menu";
import { csrfFetch } from "@/lib/csrf";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function parseErrorMessage(
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

function sanitizeMenuPayload(data: Partial<IMenu>) {
  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.title = data.title;
  if (data.location !== undefined) payload.location = data.location;
  if (data.description !== undefined && data.description !== null) {
    payload.description = data.description;
  }
  if (data.active !== undefined) payload.active = Boolean(data.active);
  if (typeof data.spaceId === "string" && data.spaceId.trim()) {
    payload.spaceId = data.spaceId.trim();
  }
  if (typeof data.organizationId === "string" && data.organizationId.trim()) {
    payload.organizationId = data.organizationId.trim();
  }
  return payload;
}

function sanitizeMenuItemPayload(
  data: Partial<IMenuItem>,
  options: { includeMenuId?: string } = {},
) {
  const payload: Record<string, unknown> = {};
  if (data.label !== undefined) payload.label = data.label;
  if (data.description !== undefined && data.description !== null) {
    payload.description = data.description;
  }
  if (data.icon !== undefined && data.icon !== null) {
    payload.icon = data.icon;
  }
  if (data.visible !== undefined) payload.visible = Boolean(data.visible);
  if (typeof data.order === "number") payload.order = data.order;

  if (data.url !== undefined) {
    payload.url = data.url === "" ? null : data.url;
  }
  if (data.pageId !== undefined) {
    payload.pageId = data.pageId === "" ? null : data.pageId;
  }
  if (data.categoryId !== undefined) {
    payload.categoryId = data.categoryId === "" ? null : data.categoryId;
  }
  if (data.parentId !== undefined) {
    payload.parentId = data.parentId === "" ? null : data.parentId;
  }

  if (options.includeMenuId) {
    payload.menuId = options.includeMenuId;
  }

  return payload;
}

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
      body: JSON.stringify(sanitizeMenuPayload(data)),
    });
    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, "Erro ao criar menu"));
    }
    return response.json();
  }

  static async updateMenu(id: string, data: Partial<IMenu>): Promise<IMenu> {
    const response = await csrfFetch(`${API_URL}/menus/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(sanitizeMenuPayload(data)),
    });
    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Erro ao atualizar menu"),
      );
    }
    return response.json();
  }

  static async deleteMenu(id: string): Promise<IMenu> {
    const response = await csrfFetch(`${API_URL}/menus/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Erro ao remover menu"),
      );
    }
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
    const items = data
      .filter((item): item is Partial<IMenuItem> & { id: string } =>
        Boolean(item.id),
      )
      .map((item, idx) => ({
        id: item.id,
        order: typeof item.order === "number" ? item.order : idx,
        parentId: item.parentId ? item.parentId : null,
      }));

    const response = await csrfFetch(`${API_URL}/menu-item/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ items }),
    });
    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Erro ao reordenar itens do menu"),
      );
    }
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
      body: JSON.stringify(
        sanitizeMenuItemPayload(data, {
          includeMenuId: data.menuId || menuId,
        }),
      ),
    });
    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Erro ao criar item do menu"),
      );
    }
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
      body: JSON.stringify(sanitizeMenuItemPayload(data)),
    });
    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Erro ao atualizar item do menu"),
      );
    }
    return response.json();
  }

  static async deleteMenuItem(id: string): Promise<IMenuItem> {
    const response = await csrfFetch(`${API_URL}/menu-item/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Erro ao remover item do menu"),
      );
    }
    return response.json();
  }
}
