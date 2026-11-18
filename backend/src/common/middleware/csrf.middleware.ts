import type { Request, Response, NextFunction } from 'express';
import { doubleCsrf } from 'csrf-csrf';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
export const CSRF_COOKIE_NAME = 'XSRF-TOKEN';

function getCookieSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    'csrf-dev-fallback-secret-key-minimum-length-64-chars-long-0000'
  );
}

export function resolveSessionIdentifier(req: Request): string {
  const anyReq = req as any;
  if (anyReq.session && typeof anyReq.session === 'object') {
    const isAuthenticated = Boolean(
      anyReq.user || anyReq.session?.passport?.user,
    );
    if (!isAuthenticated) {
      return 'anonymous-session';
    }
  }
  return anyReq.sessionID || anyReq.session?.id || 'anonymous-session';
}

const doubleCsrfUtilities = doubleCsrf({
  getSecret: () => getCookieSecret(),
  getSessionIdentifier: (req: Request) => resolveSessionIdentifier(req),
  cookieName: CSRF_COOKIE_NAME,
  cookieOptions: {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  },
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getCsrfTokenFromRequest: (req: Request) => {
    const header =
      req.headers['x-csrf-token'] ?? req.headers['x-xsrf-token'] ?? '';
    return Array.isArray(header) ? header[0] : String(header || '');
  },
  errorConfig: {
    statusCode: 403,
    message: 'Token CSRF inválido ou ausente',
    code: 'EBADCSRFTOKEN',
  },
});

export function ensureRequestCookies(req: Request): void {
  const anyReq = req as any;
  if (anyReq.cookies && typeof anyReq.cookies === 'object') {
    return;
  }

  const parsed: Record<string, string> = {};
  const cookieHeader = req.headers?.cookie;
  if (typeof cookieHeader === 'string' && cookieHeader.length > 0) {
    for (const part of cookieHeader.split(';')) {
      const idx = part.indexOf('=');
      if (idx === -1) continue;
      const key = part.slice(0, idx).trim();
      const val = part.slice(idx + 1).trim();
      if (key) {
        try {
          parsed[key] = decodeURIComponent(val);
        } catch {
          parsed[key] = val;
        }
      }
    }
  }
  anyReq.cookies = parsed;
}

export function generateCsrfToken(
  req: Request,
  res: Response,
  overwrite = false,
): string {
  ensureRequestCookies(req);
  return doubleCsrfUtilities.generateCsrfToken(req, res, { overwrite });
}

export function csrfProtectionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  ensureRequestCookies(req);

  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    if (typeof res.cookie === 'function') {
      generateCsrfToken(req, res, false);
    }
    return next();
  }

  try {
    return doubleCsrfUtilities.doubleCsrfProtection(req, res, (err?: any) => {
      if (err) {
        return res.status(403).json({
          statusCode: 403,
          message: 'Token CSRF inválido ou ausente',
        });
      }
      return next();
    });
  } catch {
    return res.status(403).json({
      statusCode: 403,
      message: 'Token CSRF inválido ou ausente',
    });
  }
}
