import { IMenuItem } from "@/app/type/menu";

export function resolveMenuItemHref(item: IMenuItem): string {
  // 1. URL direta (externa, âncora, ou caminho interno já pronto)
  if (item.url) return item.url;

  // 2. Página interna
  if (item.page) {
    const spaceSlug = item.page.space?.slug;
    return spaceSlug ? `/${spaceSlug}/${item.page.slug}` : `/${item.page.slug}`;
  }

  // 3. Categoria
  if (item.category) {
    return `/categoria/${item.category.slug}`;
  }

  // 4. Item que só agrupa filhos
  return "#";
}

export function isExternalLink(item: IMenuItem): boolean {
  return !!item.url && /^https?:\/\//i.test(item.url);
}
