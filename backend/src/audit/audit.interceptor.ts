import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';
import type { Request } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();

    // Auditoria de aplicação foca em mutações e eventos de controle
    const method = req.method?.toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next.handle();
    }

    // Ignora rotas de documentação ou healthcheck
    const url = req.originalUrl || req.url;
    if (url.startsWith('/api/docs') || url.startsWith('/health')) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          this.recordAuditLog(req, method, url, responseBody);
        },
        error: (error) => {
          // Também pode registrar mutações que falharam se desejado
        },
      }),
    );
  }

  private recordAuditLog(
    req: Request,
    method: string,
    url: string,
    responseBody: any,
  ) {
    const user: any = req.user;
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      req.ip;

    const userAgent = req.headers['user-agent'] as string;

    // Determina a Ação
    let action = 'MUTATE';
    if (url.includes('/auth/login')) action = 'LOGIN';
    else if (url.includes('/auth/logout')) action = 'LOGOUT';
    else if (method === 'POST') action = 'CREATE';
    else if (method === 'PATCH' || method === 'PUT') action = 'UPDATE';
    else if (method === 'DELETE') action = 'DELETE';

    // Determina a Entidade
    const segments = url.split('?')[0].split('/').filter(Boolean);
    const primarySegment = segments[0] || 'App';
    const entity = this.mapSegmentToEntity(primarySegment);

    // Determina o ID afetado
    const entityId =
      req.params?.id ||
      req.params?.storyId ||
      responseBody?.id ||
      (Array.isArray(req.body?.ids) ? req.body.ids.join(', ') : null);

    // Sanitiza detalhes do payload para não expor senhas ou buffers
    const details = this.sanitizeDetails({
      params: req.params,
      query: req.query,
      body: req.body,
    });

    this.auditService.logAsync({
      userId: user?.id || null,
      userEmail: user?.email || user?.username || (req.body?.email ? String(req.body.email) : null),
      action,
      entity,
      entityId: entityId ? String(entityId) : null,
      details,
      ip: ip ? String(ip) : null,
      userAgent: userAgent ? String(userAgent) : null,
      createdAt: new Date(),
    });
  }

  private mapSegmentToEntity(segment: string): string {
    const map: Record<string, string> = {
      articles: 'Article',
      media: 'Media',
      story: 'Story',
      galleries: 'Galleries',
      popups: 'Popup',
      service: 'Service',
      services: 'Service',
      user: 'User',
      settings: 'Settings',
      menu: 'Menu',
      'menu-item': 'MenuItem',
      pages: 'Page',
      organizations: 'Organization',
      spaces: 'Space',
      categories: 'Category',
      'official-gazette': 'OfficialGazette',
      auth: 'Auth',
    };
    return map[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  }

  private sanitizeDetails(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const copy = JSON.parse(JSON.stringify(data));
    const sensitiveKeys = [
      'password',
      'currentPassword',
      'newPassword',
      'token',
      'secret',
      'buffer',
      'content', // puck page json grande
    ];

    const clean = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      for (const key of Object.keys(obj)) {
        if (sensitiveKeys.includes(key)) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          clean(obj[key]);
        }
      }
    };

    clean(copy);
    return copy;
  }
}

