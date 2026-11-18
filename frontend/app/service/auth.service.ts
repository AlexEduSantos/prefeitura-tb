import { IUser } from "@/app/type/user";
import { csrfFetch, ensureCsrfToken } from "@/lib/csrf";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface ActivationTokenValidationResult {
  valid: boolean;
  email: string;
  name: string;
  expiresAt: string;
}

export class AuthService {
  static async login(email: string, password: string): Promise<IUser> {
    const response = await csrfFetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Erro ao fazer login" }));
      throw new Error(error.message || "Erro ao fazer login");
    }

    const user = await response.json();
    // Atualiza o cookie XSRF-TOKEN após criação da sessão autenticada
    await ensureCsrfToken(true);
    return user;
  }

  static async register(
    name: string,
    email: string,
    password: string,
  ): Promise<IUser> {
    const response = await csrfFetch(`${API_URL}/auth/register`, {
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
    const response = await csrfFetch(`${API_URL}/auth/logout`, {
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

  static async validateActivationToken(
    token: string,
  ): Promise<ActivationTokenValidationResult> {
    const response = await fetch(
      `${API_URL}/auth/activate-account/validate?token=${encodeURIComponent(token)}`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message:
          "O link de ativação expirou ou já foi utilizado. Entre em contato com o Administrador para solicitar o envio de um novo link.",
      }));
      throw new Error(
        Array.isArray(error.message) ? error.message.join(", ") : error.message,
      );
    }

    return response.json();
  }

  static async activateAccount(
    token: string,
    password: string,
  ): Promise<{ message: string }> {
    const response = await csrfFetch(`${API_URL}/auth/activate-account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, password }),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message:
          "O link de ativação expirou ou já foi utilizado. Entre em contato com o Administrador para solicitar o envio de um novo link.",
      }));
      throw new Error(
        Array.isArray(error.message) ? error.message.join(", ") : error.message,
      );
    }

    return response.json();
  }
}
