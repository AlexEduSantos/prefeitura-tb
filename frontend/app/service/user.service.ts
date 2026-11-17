import { IUser } from "@/app/type/user";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class UserService {
  static async getUsers(): Promise<IUser[]> {
    const response = await fetch(`${API_URL}/user`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar usuários");
    }

    return response.json();
  }

  static async getUserById(id: string): Promise<IUser> {
    const response = await fetch(`${API_URL}/user/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar usuário");
    }

    return response.json();
  }

  private static sanitizeUserPayload(data: Partial<IUser>) {
    const {
      id: _id,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      lastLogin: _lastLogin,
      organization: _organization,
      ...allowed
    } = data as any;
    return allowed;
  }

  static async createUser(data: Partial<IUser>): Promise<IUser> {
    const payload = this.sanitizeUserPayload(data);
    const response = await fetch(`${API_URL}/user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao criar usuário");
    }

    return response.json();
  }

  static async updateUser(id: string, data: Partial<IUser>) {
    const payload = this.sanitizeUserPayload(data);
    const response = await fetch(`${API_URL}/user/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      const message = Array.isArray(errData?.message)
        ? errData.message.join(", ")
        : errData?.message || "Erro ao atualizar usuário";
      throw new Error(message);
    }

    return response.json();
  }

  static async deleteUser(id: string): Promise<IUser> {
    const response = await fetch(`${API_URL}/user/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao deletar usuário");
    }

    return response.json();
  }
}
