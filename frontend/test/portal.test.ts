import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  CSRF_HEADER_NAME,
  getCsrfTokenFromCookie,
  withCsrfHeaders,
} from "@/lib/csrf";
import { isExternalLink, resolveMenuItemHref } from "@/lib/menu-utils";
import { captureFrontendException } from "@/lib/telemetry";
import { MenuService } from "@/app/service/menu.service";
import type { IMenuItem } from "@/app/type/menu";

describe("Portal Prefeitura — Suíte Unitária Frontend", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("deve extrair XSRF-TOKEN do cookie e anexar o cabeçalho X-CSRF-Token", () => {
    const cookieHeader = "connect.sid=abc; XSRF-TOKEN=sig123.rand456; theme=light";
    expect(getCsrfTokenFromCookie(cookieHeader)).toBe("sig123.rand456");

    const headers = withCsrfHeaders(
      { "Content-Type": "application/json" },
      cookieHeader,
    );
    expect(headers[CSRF_HEADER_NAME]).toBe("sig123.rand456");
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("resolveMenuItemHref e isExternalLink devem montar URLs internas e identificar links externos", () => {
    const externalItem = {
      id: "1",
      label: "Transparência",
      url: "https://transparencia.prefeitura.pr.gov.br",
    } as IMenuItem;
    expect(isExternalLink(externalItem)).toBe(true);
    expect(resolveMenuItemHref(externalItem)).toBe(
      "https://transparencia.prefeitura.pr.gov.br",
    );

    const spacePageItem = {
      id: "2",
      label: "Matrículas",
      page: { slug: "matriculas", space: { slug: "educacao" } },
    } as unknown as IMenuItem;
    expect(isExternalLink(spacePageItem)).toBe(false);
    expect(resolveMenuItemHref(spacePageItem)).toBe("/educacao/matriculas");

    const categoryItem = {
      id: "3",
      label: "Saúde",
      category: { slug: "saude" },
    } as unknown as IMenuItem;
    expect(resolveMenuItemHref(categoryItem)).toBe("/categoria/saude");
  });

  it("captureFrontendException deve formatar payload estruturado de telemetria", () => {
    const event = captureFrontendException(new Error("Falha de renderização"), {
      boundary: "portal-unit",
    });
    expect(event.message).toBe("Falha de renderização");
    expect(event.context).toEqual({ boundary: "portal-unit" });
    expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("MenuService.getMenuByField deve consultar /menus/by/:field/:value com credentials include", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: "m1", title: "Principal", location: "header" }],
    });
    vi.stubGlobal("fetch", fetchMock);

    const menus = await MenuService.getMenuByField({
      field: "location",
      value: "header",
    });

    expect(menus).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/menus/by/location/header"),
      expect.objectContaining({ credentials: "include" }),
    );
  });
});
