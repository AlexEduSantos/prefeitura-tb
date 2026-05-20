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
}
