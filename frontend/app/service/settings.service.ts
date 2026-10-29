const API_URL = process.env.NEXT_PUBLIC_API_URL + "/settings";

export class SettingsService {
  static async getSettings() {
    const response = await fetch(`${API_URL}`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Erro ao buscar configurações");
    return response.json();
  }

  static async updateSettings(settings: any) {
    const response = await fetch(`${API_URL}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error("Erro ao atualizar configurações");
    return response.json();
  }
}
