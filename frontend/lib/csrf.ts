export const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
export const CSRF_HEADER_NAME = 'X-CSRF-Token';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}

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

/**
 * Garante que exista um token CSRF válido antes de executar uma mutação.
 */
export async function ensureCsrfToken(forceRefresh = false): Promise<string | null> {
  if (!forceRefresh) {
    const existing = getCsrfTokenFromCookie();
    if (existing) {
      return existing;
    }
  }

  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/csrf-token`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) {
      return getCsrfTokenFromCookie();
    }
    const data = await response.json().catch(() => null);
    const refreshed =
      typeof data?.csrfToken === 'string' && data.csrfToken
        ? data.csrfToken
        : null;
    if (refreshed && typeof document !== 'undefined') {
      document.cookie = `${CSRF_COOKIE_NAME}=${encodeURIComponent(refreshed)}; path=/; SameSite=Lax`;
    }
    return refreshed || getCsrfTokenFromCookie();
  } catch {
    return getCsrfTokenFromCookie();
  }
}

/**
 * Wrapper de fetch que envia cookies de sessão e injeta automaticamente o header
 * X-CSRF-Token em métodos de mutação (POST, PUT, PATCH, DELETE).
 */
export async function csrfFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers);

  if (MUTATING_METHODS.has(method)) {
    const token = getCsrfTokenFromCookie() || (await ensureCsrfToken());
    if (token && !headers.has(CSRF_HEADER_NAME)) {
      headers.set(CSRF_HEADER_NAME, token);
    }
  }

  const response = await fetch(input, {
    ...init,
    headers,
    credentials: init.credentials ?? 'include',
  });

  if (response.status === 403 && MUTATING_METHODS.has(method)) {
    const refreshedToken = await ensureCsrfToken(true);
    if (refreshedToken) {
      headers.set(CSRF_HEADER_NAME, refreshedToken);
      return fetch(input, {
        ...init,
        headers,
        credentials: init.credentials ?? 'include',
      });
    }
  }

  return response;
}
