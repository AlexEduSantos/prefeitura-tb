export const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
export const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Extrai o token CSRF armazenado no cookie XSRF-TOKEN no navegador.
 */
export function getCsrfTokenFromCookie(cookieSource?: string): string | null {
  const rawCookie =
    cookieSource ?? (typeof document !== 'undefined' ? document.cookie : '');
  if (!rawCookie) return null;

  const prefix = `${CSRF_COOKIE_NAME}=`;
  const parts = rawCookie.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

/**
 * Anexa o cabeçalho X-CSRF-Token em requisições de mutação (POST/PATCH/DELETE).
 */
export function withCsrfHeaders(
  headers: Record<string, string> = {},
  cookieSource?: string,
): Record<string, string> {
  const token = getCsrfTokenFromCookie(cookieSource);
  if (!token) {
    return { ...headers };
  }
  return {
    ...headers,
    [CSRF_HEADER_NAME]: token,
  };
}
