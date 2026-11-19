import { IUser } from "@/app/type/user";
import { csrfFetch } from "@/lib/csrf";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function parseErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  const errData = await response.json().catch(() => null);
  if (Array.isArray(errData?.message)) return errData.message.join(", ");
  if (typeof errData?.message === "string" && errData.message.trim()) {
    return errData.message;
  }
  return fallback;
}

export class UserService {
  static async getUsers(): Promise<IUser[]> {
    const response = await fetch(`${API_URL}/user`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Erro ao buscar usuários"),
      );
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
      throw new Error(
        await parseErrorMessage(response, "Erro ao buscar usuário"),
      );
    }

    return response.json();
  }

  private static sanitizeUserPayload(data: Partial<IUser>) {
    const raw = data as Record<string, unknown>;
    const payload: Record<string, unknown> = {};

    if (typeof raw.name === "string") payload.name = raw.name;
    if (typeof raw.username === "string") payload.username = raw.username;
    if (typeof raw.email === "string") payload.email = raw.email;
    if (typeof raw.password === "string" && raw.password.trim() !== "") {
      payload.password = raw.password;
    }
    if (typeof raw.avatar === "string") payload.avatar = raw.avatar;
    if (raw.phone !== undefined) payload.phone = raw.phone;
    if (typeof raw.active === "boolean") payload.active = raw.active;
    if (raw.organizationId !== undefined) {
      payload.organizationId =
        raw.organizationId === "" ? null : raw.organizationId;
    }
    if (typeof raw.role === "string") payload.role = raw.role;

    return payload;
  }

  static async createUser(data: Partial<IUser>): Promise<IUser> {
    const payload = this.sanitizeUserPayload(data);
    const response = await csrfFetch(`${API_URL}/user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Erro ao criar usuário"),
      );
    }

    return response.json();
  }

  static async resendActivation(
    id: string,
  ): Promise<{ message: string; expiresAt: string }> {
    const response = await csrfFetch(
      `${API_URL}/user/${id}/resend-activation`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Erro ao reenviar link de ativação"),
      );
    }

    return response.json();
  }

  static async updateUser(id: string, data: Partial<IUser>) {
    const payload = this.sanitizeUserPayload(data);
    const response = await csrfFetch(`${API_URL}/user/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Erro ao atualizar usuário"),
      );
    }

    return response.json();
  }

  static async deleteUser(id: string): Promise<IUser> {
    const response = await csrfFetch(`${API_URL}/user/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Erro ao deletar usuário"),
      );
    }

    return response.json();
  }
}
