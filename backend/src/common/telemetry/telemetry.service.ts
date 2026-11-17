import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';

export interface TelemetryEventPayload {
  traceId: string;
  spanId: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
}

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);
  private readonly recentEvents: TelemetryEventPayload[] = [];

  generateTraceContext(): { traceId: string; spanId: string } {
    return {
      traceId: randomBytes(16).toString('hex'),
      spanId: randomBytes(8).toString('hex'),
    };
  }

  captureException(
    error: unknown,
    context?: Record<string, unknown>,
  ): TelemetryEventPayload {
    const { traceId, spanId } = this.generateTraceContext();
    const errObj =
      error instanceof Error ? error : new Error(String(error ?? 'Unknown'));

    const payload: TelemetryEventPayload = {
      traceId,
      spanId,
      timestamp: new Date().toISOString(),
      level: 'error',
      message: errObj.message,
      stack: errObj.stack,
      context,
    };

    this.recentEvents.unshift(payload);
    if (this.recentEvents.length > 100) {
      this.recentEvents.pop();
    }

    this.logger.error(
      `[trace=${traceId}] ${errObj.message}`,
      errObj.stack,
    );

    void this.dispatchExternal(payload);
    return payload;
  }

  getRecentEvents(): TelemetryEventPayload[] {
    return [...this.recentEvents];
  }

  private async dispatchExternal(payload: TelemetryEventPayload): Promise<void> {
    const sentryDsn = process.env.SENTRY_DSN;
    const otelEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

    if (sentryDsn) {
      try {
        const parsed = new URL(sentryDsn);
        const projectId = parsed.pathname.replace(/^\//, '');
        const publicKey = parsed.username;
        const storeUrl = `${parsed.protocol}//${parsed.host}/api/${projectId}/store/`;

        await fetch(storeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${publicKey}`,
          },
          body: JSON.stringify({
            event_id: payload.traceId,
            timestamp: payload.timestamp,
            level: payload.level,
            platform: 'node',
            message: payload.message,
            extra: payload.context,
          }),
        });
      } catch {
        // Evita falha em cascata se o coletor externo estiver inacessível
      }
    }

    if (otelEndpoint) {
      try {
        await fetch(`${otelEndpoint.replace(/\/$/, '')}/v1/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resourceLogs: [
              {
                scopeLogs: [
                  {
                    logRecords: [
                      {
                        timeUnixNano: String(Date.now() * 1_000_000),
                        severityText: 'ERROR',
                        body: { stringValue: payload.message },
                        traceId: payload.traceId,
                        spanId: payload.spanId,
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        });
      } catch {
        // Evita falha em cascata se o coletor OTLP estiver inacessível
      }
    }
  }
}
