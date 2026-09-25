import { IEntity } from "../type/entity";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class EntityService {
  static async getEntities(): Promise<IEntity[]> {
    const response = await fetch(`${API_URL}/entities`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar secretarias/entidades");
    }

    return response.json();
  }
  static async createEntity(data: {
    title: string;
    slug: string;
  }): Promise<IEntity> {
    const response = await fetch(`${API_URL}/entities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Erro ao criar secretaria/entidade");
    }

    return response.json();
  }

  static async updateEntity(
    id: string,
    data: { title: string; slug: string },
  ): Promise<IEntity> {
    const response = await fetch(`${API_URL}/entities/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Erro ao atualizar secretaria/entidade");
    }

    return response.json();
  }

  static async deleteEntity(id: string): Promise<IEntity> {
    const response = await fetch(`${API_URL}/entities/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao deletar secretaria/entidade");
    }

    return response.json();
  }
}
