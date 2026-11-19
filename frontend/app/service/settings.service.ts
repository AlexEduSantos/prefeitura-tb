import { csrfFetch } from "@/lib/csrf";

const API_URL =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001") + "/settings";

const ALLOWED_STRING_FIELDS = [
  "siteName",
  "siteDescription",
  "logoUrl",
  "faviconUrl",
  "primaryColor",
  "primaryForegroundColor",
  "secondaryColor",
  "secondaryForegroundColor",
  "addressStreet",
  "addressNumber",
  "addressCity",
  "addressState",
  "addressZip",
  "phone",
  "email",
  "workingHours",
] as const;

const ALLOWED_OBJECT_FIELDS = ["themeColors", "socialLinks"] as const;

function sanitizeSettingsPayload(settings: Record<string, unknown>) {
  const payload: Record<string, unknown> = {};

  for (const key of ALLOWED_STRING_FIELDS) {
    const value = settings[key];
    if (typeof value === "string") {
      payload[key] = value;
    }
  }

  for (const key of ALLOWED_OBJECT_FIELDS) {
    const value = settings[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      payload[key] = value;
    }
  }

  return payload;
}

export class SettingsService {
  static async getSettings() {
    const response = await fetch(`${API_URL}`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao buscar configurações");
    return response.json();
  }

  static async updateSettings(settings: Record<string, unknown>) {
    const response = await csrfFetch(`${API_URL}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sanitizeSettingsPayload(settings)),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const msg = Array.isArray(body?.message)
        ? body.message.join(", ")
        : body?.message;
      throw new Error(msg || "Erro ao atualizar configurações");
    }
    return response.json();
  }
}
