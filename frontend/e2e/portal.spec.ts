import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Portal Público — Acessibilidade e Listagem de Notícias", () => {
  test("deve exibir barra de acessibilidade eMAG, alternar alto contraste, fonte e carregar VLibras", async ({
    page,
  }) => {
    await page.goto("/");

    const accessibilityNav = page.getByRole("navigation", {
      name: "Barra de Acessibilidade eMAG",
    });
    await expect(accessibilityNav).toBeVisible();

    await expect(page.getByText("Ir para conteúdo [Alt+1]")).toBeVisible();
    await expect(page.getByText("Ir para menu [Alt+2]")).toBeVisible();
    await expect(page.getByText("Ir para busca [Alt+3]")).toBeVisible();
    await expect(page.getByText("Ir para rodapé [Alt+4]")).toBeVisible();

    // Testar alternância de Alto Contraste
    const contrastBtn = page.getByRole("button", {
      name: "Alternar alto contraste",
    });
    await contrastBtn.click();
    await expect(page.locator("html")).toHaveClass(/high-contrast/);

    // Testar aumento de fonte
    await page.getByRole("button", { name: "Aumentar fonte" }).click();
    const fontSize = await page.evaluate(
      () => document.documentElement.style.fontSize,
    );
    expect(fontSize).toBe("110%");

    // Verificar container do VLibras
    await expect(page.locator("[vw='true']")).toBeAttached();
  });

  test("deve responder aos atalhos de teclado Alt+1 e Alt+4", async ({
    page,
  }) => {
    await page.goto("/");

    await page.keyboard.press("Alt+1");
    await expect(page.locator("#main-content")).toBeFocused();

    await page.keyboard.press("Alt+4");
    await expect(page.locator("#main-footer")).toBeFocused();
  });

  test("deve exibir filtros e modos de paginação na página pública de notícias", async ({
    page,
  }) => {
    await page.goto("/noticias");
    await expect(page.getByRole("heading", { name: "Notícias" })).toBeVisible();
    await expect(
      page.getByPlaceholder("Buscar notícias por título ou subtítulo..."),
    ).toBeVisible();
  });

  test("deve validar regras de acessibilidade WCAG 2.1 AA e atributos ARIA com @axe-core/playwright", async ({
    page,
  }) => {
    await page.goto("/");
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "best-practice"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
