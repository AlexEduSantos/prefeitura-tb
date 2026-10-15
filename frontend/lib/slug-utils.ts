/**
 * Converte uma string em um slug URL-friendly padronizado e higienizado:
 * - Remove acentuação e diacríticos (NFD)
 * - Converte para minúsculas
 * - Remove caracteres especiais, permitindo apenas letras, números e hífens
 * - Substitui espaços e múltiplos hífens consecutivos por um único hífen
 * - Remove hífens no início e no final
 */
export function generateSlug(text: string): string {
  if (!text) return "";

  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // remove caracteres não alfanuméricos exceto espaços e hífens
    .replace(/[\s_]+/g, "-") // substitui espaços e underscores por hífen
    .replace(/-+/g, "-") // substitui múltiplos hífens por um único
    .replace(/^-+|-+$/g, ""); // remove hífens das extremidades
}
