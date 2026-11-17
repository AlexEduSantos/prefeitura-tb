export interface FrontendTelemetryEvent {
  timestamp: string;
  message: string;
  stack?: string;
  digest?: string;
  url?: string;
  context?: Record<string, unknown>;
}

export function captureFrontendException(
  error: unknown,
  context?: Record<string, unknown>,
): FrontendTelemetryEvent {
  const errObj =
    error instanceof Error ? error : new Error(String(error ?? 'Unknown'));

  const payload: FrontendTelemetryEvent = {
    timestamp: new Date().toISOString(),
    message: errObj.message,
    stack: errObj.stack,
    digest: (error as any)?.digest,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    context,
  };

  if (process.env.NODE_ENV !== 'production') {
    console.error('[Telemetry]', payload);
  }

  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (sentryDsn && typeof fetch === 'function') {
    try {
      const parsed = new URL(sentryDsn);
      const projectId = parsed.pathname.replace(/^\//, '');
      const publicKey = parsed.username;
      const storeUrl = `${parsed.protocol}//${parsed.host}/api/${projectId}/store/`;

      void fetch(storeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${publicKey}`,
        },
        body: JSON.stringify({
          timestamp: payload.timestamp,
          level: 'error',
          platform: 'javascript',
          message: payload.message,
          extra: {
            ...payload.context,
            url: payload.url,
            digest: payload.digest,
          },
        }),
      }).catch(() => {});
    } catch {
      // Ignora erro de parse do DSN
    }
  }

  return payload;
}
