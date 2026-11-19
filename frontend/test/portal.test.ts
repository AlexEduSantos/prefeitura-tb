import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  csrfFetch,
  getCsrfTokenFromCookie,
  withCsrfHeaders,
} from "@/lib/csrf";
import {
  sanitizeEmbedHtml,
  sanitizeHtml,
  sanitizeSvg,
} from "@/lib/sanitize-html";
import { isExternalLink, resolveMenuItemHref } from "@/lib/menu-utils";
import { captureFrontendException } from "@/lib/telemetry";
import { MenuService } from "@/app/service/menu.service";
import { AuthService } from "@/app/service/auth.service";
import { StoriesService } from "@/app/service/stories.service";
import { PopupsService } from "@/app/service/popups.service";
import { GalleryService } from "@/app/service/gallery.service";
import {
  CategoryService,
  OrganizationService,
} from "@/app/service/organization.service";
import { ApprovalService } from "@/app/service/approval.service";
import { MediaService } from "@/app/service/media.service";
import { AuditService } from "@/app/service/audit.service";
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

  it("csrfFetch deve buscar /auth/csrf-token quando cookie estiver ausente e enviar X-CSRF-Token em mutações", async () => {
    const cookieStore = { value: "" };
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", {
      get cookie() {
        return cookieStore.value;
      },
      set cookie(val: string) {
        cookieStore.value = val;
      },
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ csrfToken: "fetched.token.123" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "art-1" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await csrfFetch("http://localhost:3001/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Teste" }),
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain("/auth/csrf-token");
    const postInit = fetchMock.mock.calls[1][1] as RequestInit;
    const sentHeaders = new Headers(postInit.headers);
    expect(sentHeaders.get(CSRF_HEADER_NAME)).toBe("fetched.token.123");
    expect(postInit.credentials).toBe("include");
  });

  it("sanitizeHtml, sanitizeEmbedHtml e sanitizeSvg devem neutralizar vetores de XSS", () => {
    const dirtyHtml =
      '<p>Olá</p><img src="x" onerror="alert(1)"><script>alert(2)</script><a href="javascript:alert(3)">Clique</a><iframe src="https://evil.com"></iframe>';
    const cleanHtml = sanitizeHtml(dirtyHtml);
    expect(cleanHtml).toContain("<p>Olá</p>");
    expect(cleanHtml).not.toContain("<script");
    expect(cleanHtml).not.toContain("onerror=");
    expect(cleanHtml).not.toContain("javascript:");
    expect(cleanHtml).not.toContain("<iframe");

    const dirtyEmbed =
      '<script>steal()</script><iframe src="javascript:alert(1)" onload="x()"></iframe><iframe src="https://www.youtube.com/embed/abc"></iframe>';
    const cleanEmbed = sanitizeEmbedHtml(dirtyEmbed);
    expect(cleanEmbed).not.toContain("<script");
    expect(cleanEmbed).not.toContain("onload=");
    expect(cleanEmbed).not.toContain("javascript:");
    expect(cleanEmbed).toContain('src="https://www.youtube.com/embed/abc"');
    expect(cleanEmbed).toContain("sandbox=");

    const dirtySvg =
      '<svg class="cls-1" onload="alert(1)"><script>x()</script><foreignObject>bad</foreignObject><path fill="#fff" d="M0 0"/></svg>';
    const cleanSvg = sanitizeSvg(dirtySvg);
    expect(cleanSvg).toContain("<svg");
    expect(cleanSvg).not.toContain("<script");
    expect(cleanSvg).not.toContain("<foreignObject");
    expect(cleanSvg).not.toContain("onload=");
    expect(sanitizeSvg("<html><body>404</body></html>")).toBe("");
  });

  it("AuthService.validateActivationToken e activateAccount devem consultar os endpoints corretos e propagar erro de expiração", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          message:
            "O link de ativação expirou ou já foi utilizado. Entre em contato com o Administrador para solicitar o envio de um novo link.",
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      AuthService.validateActivationToken("expired-tok"),
    ).rejects.toThrow("Entre em contato com o Administrador");
    expect(fetchMock.mock.calls[0][0]).toContain(
      "/auth/activate-account/validate?token=expired-tok",
    );
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

  it("Services administrativos e públicos devem consultar as rotas corretas (/popups/admin, /galleries/admin, /story/items/:id e /organizations/admin/tree)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", {
      cookie: "XSRF-TOKEN=tok-unit-test",
    });

    await StoriesService.getStoriesItemById("item-42");
    expect(fetchMock.mock.calls[0][0]).toContain("/story/items/item-42");

    await StoriesService.deleteStoriesItem("item-42");
    expect(fetchMock.mock.calls[1][0]).toContain("/story/items/item-42");

    await PopupsService.getPopupsList();
    expect(fetchMock.mock.calls[2][0]).toContain("/popups/admin");

    await GalleryService.getAdminGalleryList();
    expect(fetchMock.mock.calls[3][0]).toContain("/galleries/admin");

    await OrganizationService.getTree("all");
    expect(fetchMock.mock.calls[4][0]).toContain(
      "/organizations/admin/tree?includeInactive=all",
    );

    await OrganizationService.getTree();
    expect(fetchMock.mock.calls[5][0]).toMatch(/\/organizations\/tree$/);
  });

  it("ApprovalService deve listar fila, aprovar com edição, rejeitar com motivo e reenviar rascunho", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], summary: { pendente: 0 } }),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", {
      cookie: "XSRF-TOKEN=tok-approval-test",
    });

    await ApprovalService.getRequests({
      status: "pendente",
      entityType: "Page",
    });
    expect(fetchMock.mock.calls[0][0]).toContain(
      "/approvals?status=pendente&entityType=Page",
    );

    await ApprovalService.approveRequest("req-1", { title: "Editado" });
    expect(fetchMock.mock.calls[1][0]).toContain("/approvals/req-1/approve");
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: "PATCH",
      body: JSON.stringify({ proposedData: { title: "Editado" } }),
    });

    await ApprovalService.rejectRequest("req-2", "Falta anexo");
    expect(fetchMock.mock.calls[2][0]).toContain("/approvals/req-2/reject");
    expect(fetchMock.mock.calls[2][1]).toMatchObject({
      method: "PATCH",
      body: JSON.stringify({ reason: "Falta anexo" }),
    });

    await ApprovalService.resubmitRequest("req-2", { title: "Corrigido" });
    expect(fetchMock.mock.calls[3][0]).toContain("/approvals/req-2/resubmit");
    expect(fetchMock.mock.calls[3][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ proposedData: { title: "Corrigido" } }),
    });
  });

  it("MediaService deve codificar segmentos de pasta com espaço/acento e omitir id no body de updateMedia", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ folders: [], files: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", {
      cookie: "XSRF-TOKEN=tok-media-test",
    });

    await MediaService.listMediaByPrefix("Imagens/Banner Principal", 1, "asc", 10);
    expect(fetchMock.mock.calls[0][0]).toContain(
      "/media/list/Imagens/Banner%20Principal?page=1&limit=10&sort=asc",
    );

    await MediaService.updateMedia({
      id: "media-1",
      title: "Banner Atualizado",
      altText: "Alt",
    });
    expect(fetchMock.mock.calls[1][0]).toContain("/media/media-1");
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: "PATCH",
      body: JSON.stringify({ title: "Banner Atualizado", altText: "Alt" }),
    });
  });

  it("AuditService.getAuditLogs deve montar query params limpos e propagar erro do backend", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ id: "log-1", action: "CREATE", entity: "Page" }],
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: ["page must be an integer number"] }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const res = await AuditService.getAuditLogs({
      page: 1,
      limit: 20,
      action: "all",
      entity: "Page",
      search: "  admin  ",
    });

    expect(res.total).toBe(1);
    expect(fetchMock.mock.calls[0][0]).toContain(
      "/audit-logs?page=1&limit=20&entity=Page&search=admin",
    );
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "GET",
      credentials: "include",
    });

    await expect(AuditService.getAuditLogs({ page: 1 })).rejects.toThrow(
      "page must be an integer number",
    );
  });

  it("CategoryService.updateCategory deve omitir id, parentId vazio e metadados do body PATCH", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "cat-1", title: "Notícias", slug: "noticias" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          message: "Já existe uma categoria com este apelido (slug).",
        }),
      });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", {
      cookie: "XSRF-TOKEN=tok-cat-test",
    });

    await CategoryService.updateCategory("cat-1", {
      id: "cat-1",
      title: "Notícias",
      slug: "noticias",
      parentId: "",
      createdAt: "2026-01-01T00:00:00Z",
    });

    expect(fetchMock.mock.calls[0][0]).toContain("/categories/cat-1");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "PATCH",
      body: JSON.stringify({ title: "Notícias", slug: "noticias" }),
    });

    await expect(
      CategoryService.updateCategory("cat-1", {
        title: "Notícias",
        slug: "duplicado",
      }),
    ).rejects.toThrow("Já existe uma categoria com este apelido (slug).");
  });

  it("GalleryService.updateGallery deve sanitizar id, organizationId vazio e objeto media nos slides", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "gal-1", title: "Galeria 1", active: true }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: ["slides.0.mediaId must be a UUID"] }),
      });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", {
      cookie: "XSRF-TOKEN=tok-gal-test",
    });

    await GalleryService.updateGallery({
      id: "gal-1",
      title: "Galeria Editada",
      active: true,
      organizationId: "",
      slides: [
        {
          id: "slide-1",
          galleryId: "gal-1",
          mediaId: "11111111-1111-4111-8111-111111111111",
          order: 1,
          caption: "Legenda",
          link: "",
          media: { id: "11111111-1111-4111-8111-111111111111", key: "a.jpg" },
        } as never,
      ],
    } as never);

    expect(fetchMock.mock.calls[0][0]).toContain("/galleries/gal-1");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "PATCH",
      body: JSON.stringify({
        title: "Galeria Editada",
        active: true,
        slides: [
          {
            mediaId: "11111111-1111-4111-8111-111111111111",
            order: 1,
            caption: "Legenda",
            link: "",
          },
        ],
      }),
    });

    await expect(
      GalleryService.updateGallery({
        id: "gal-1",
        title: "Galeria",
        active: true,
        slides: [],
      } as never),
    ).rejects.toThrow("slides.0.mediaId must be a UUID");
  });
});
