import { IOrganization, ISpace, ICategory } from "../type/organization";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class OrganizationService {
  static async getOrganizations(
    includeInactive = false,
  ): Promise<IOrganization[]> {
    const response = await fetch(
      `${API_URL}/organizations?includeInactive=${includeInactive}`,
      {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );
    if (!response.ok) throw new Error("Erro ao buscar organizações");
    return response.json();
  }

  static async getTree(includeInactive?: string): Promise<IOrganization[]> {
    const response = await fetch(
      `${API_URL}/organizations/tree?includeInactive=${includeInactive || "active"}`,
      {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );
    if (!response.ok)
      throw new Error("Erro ao buscar organograma de organizações");
    return response.json();
  }

  static async createOrganization(
    data: Partial<IOrganization>,
  ): Promise<IOrganization> {
    const response = await fetch(`${API_URL}/organizations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Erro ao criar organização");
    return response.json();
  }

  static async updateOrganization(
    id: string,
    data: Partial<IOrganization>,
  ): Promise<IOrganization> {
    const response = await fetch(`${API_URL}/organizations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Erro ao atualizar organização");
    return response.json();
  }

  static async deleteOrganization(id: string): Promise<IOrganization> {
    const response = await fetch(`${API_URL}/organizations/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao remover organização");
    return response.json();
  }

  static async changeParent(
    id: string,
    parentId: string | null,
  ): Promise<IOrganization> {
    const response = await fetch(`${API_URL}/organizations/${id}/change-parent`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ parentId }),
    });
    if (!response.ok) throw new Error("Erro ao alterar vinculação hierárquica");
    return response.json();
  }
}

export class SpaceService {
  static async getSpaces(): Promise<ISpace[]> {
    const response = await fetch(`${API_URL}/spaces`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao buscar espaços");
    return response.json();
  }

  static async getSpaceBySlug(slug: string): Promise<ISpace> {
    const response = await fetch(`${API_URL}/spaces/slug/${slug}`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao buscar espaço por slug");
    return response.json();
  }

  static async createSpace(data: Partial<ISpace>): Promise<ISpace> {
    const response = await fetch(`${API_URL}/spaces`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Erro ao criar espaço");
    return response.json();
  }

  static async deleteSpace(id: string): Promise<ISpace> {
    const response = await fetch(`${API_URL}/spaces/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao remover espaço");
    return response.json();
  }

  static async updateSpace(id: string, data: Partial<ISpace>): Promise<ISpace> {
    const response = await fetch(`${API_URL}/spaces/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Erro ao atualizar espaço");
    return response.json();
  }
}

export class CategoryService {
  static async getCategories(): Promise<ICategory[]> {
    const response = await fetch(`${API_URL}/categories`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao buscar categorias");
    return response.json();
  }

  static async getTree(): Promise<ICategory[]> {
    const response = await fetch(`${API_URL}/categories/tree`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao buscar árvore de categorias");
    return response.json();
  }

  static async createCategory(data: Partial<ICategory>): Promise<ICategory> {
    const response = await fetch(`${API_URL}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Erro ao criar categoria");
    return response.json();
  }

  static async updateCategory(
    id: string,
    data: Partial<ICategory>,
  ): Promise<ICategory> {
    const response = await fetch(`${API_URL}/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Erro ao atualizar categoria");
    return response.json();
  }

  static async deleteCategory(id: string): Promise<ICategory> {
    const response = await fetch(`${API_URL}/categories/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao remover categoria");
    return response.json();
  }
}
