import { IPopups } from "../type/popup";
import { csrfFetch } from "@/lib/csrf";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const VALID_POPUP_TYPES = new Set(["modal", "bar", "corner", "fullscreen"]);

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

function toIsoDate(value: unknown): string | undefined {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export class PopupsService {
  static async getPublicPopupsList(): Promise<IPopups[]> {
    const response = await fetch(`${API_URL}/popups`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar popups públicos");
    }

    return response.json();
  }

  static async getPopupsList(): Promise<IPopups[]> {
    const response = await fetch(`${API_URL}/popups/admin`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar popups");
    }

    return response.json();
  }

  static async getPopupsById(id: string): Promise<IPopups> {
    const response = await fetch(`${API_URL}/popups/admin/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar popups");
    }

    return response.json();
  }

  private static sanitizePopupPayload(popup: Partial<IPopups>) {
    const raw = popup as Record<string, unknown>;
    const payload: Record<string, unknown> = {};

    if (typeof raw.title === "string") payload.title = raw.title;
    if (typeof raw.imageId === "string" && raw.imageId.trim()) {
      payload.imageId = raw.imageId.trim();
    }
    if (typeof raw.link === "string") payload.link = raw.link;
    if (typeof raw.active === "boolean") payload.active = raw.active;
    if (raw.displayTime !== undefined && raw.displayTime !== "") {
      const n = Number(raw.displayTime);
      if (!Number.isNaN(n)) payload.displayTime = Math.trunc(n);
    }
    if (typeof raw.status === "string" && raw.status.trim()) {
      payload.status = raw.status.trim();
    }
    if (typeof raw.type === "string" && VALID_POPUP_TYPES.has(raw.type)) {
      payload.type = raw.type;
    }
    if (typeof raw.position === "string" && raw.position.trim()) {
      payload.position = raw.position.trim();
    }
    if (typeof raw.closeButton === "boolean") {
      payload.closeButton = raw.closeButton;
    }
    if (raw.priority !== undefined && raw.priority !== "") {
      const n = Number(raw.priority);
      if (!Number.isNaN(n)) payload.priority = Math.trunc(n);
    }

    const pubDate = toIsoDate(raw.publicationDate);
    if (pubDate) payload.publicationDate = pubDate;

    const expDate = toIsoDate(raw.expirationDate);
    if (expDate) payload.expirationDate = expDate;

    if (raw.organizationId !== undefined) {
      payload.organizationId =
        raw.organizationId === "" ? null : raw.organizationId;
    }
    if (raw.spaceId !== undefined) {
      payload.spaceId = raw.spaceId === "" ? null : raw.spaceId;
    }

    return payload;
  }

  static async createPopups(popup: Partial<IPopups>): Promise<IPopups> {
    const payload = this.sanitizePopupPayload(popup);
    const response = await csrfFetch(`${API_URL}/popups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, "Erro ao criar popup"));
    }

    return response.json();
  }

  static async updatePopups(
    id: string,
    popup: Partial<IPopups>,
  ): Promise<IPopups> {
    const payload = this.sanitizePopupPayload(popup);
    const response = await csrfFetch(`${API_URL}/popups/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Erro ao atualizar popup"),
      );
    }

    return response.json();
  }

  static async deletePopups(id: string): Promise<IPopups> {
    const response = await csrfFetch(`${API_URL}/popups/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Erro ao deletar popup"),
      );
    }

    return response.json();
  }

  static async approvePopup(id: string): Promise<IPopups> {
    const response = await csrfFetch(`${API_URL}/popups/${id}/approve`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Erro ao aprovar popup"),
      );
    }
    return response.json();
  }

  static async rejectPopup(id: string, reason?: string): Promise<IPopups> {
    const response = await csrfFetch(`${API_URL}/popups/${id}/reject`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      throw new Error(
        await parseErrorMessage(response, "Erro ao rejeitar popup"),
      );
    }
    return response.json();
  }
}
