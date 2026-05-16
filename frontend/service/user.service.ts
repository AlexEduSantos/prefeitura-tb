import { IUser } from "@/type/user";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class UserService {
  static async getUsers(): Promise<IUser> {
    const response = await fetch(`${API_URL}/auth/profile`, {
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
}
