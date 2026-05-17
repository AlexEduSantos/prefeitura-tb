import { IUser } from "@/app/type/user";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class AuthService {
  static async login(email: string, password: string): Promise<IUser> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include", // Importante para enviar e receber cookies da sessão
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Erro ao fazer login" }));
      throw new Error(error.message || "Erro ao fazer login");
    }

    return response.json();
  }

  static async register(
    name: string,
    email: string,
    password: string,
  ): Promise<IUser> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Erro ao registrar" }));
      throw new Error(error.message || "Erro ao registrar");
    }

    return response.json();
  }

  static async logout(): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Erro ao fazer logout" }));
      throw new Error(error.message || "Erro ao fazer logout");
    }

    return response.json();
  }
}
