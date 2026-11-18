import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const PRIVATE_ADMIN_ROUTE_RE =
  /^\/(user|auth|audit-logs)(\/|$|\?)|(?:^|\/)admin(?:\/|$|\?)/i;

const USER_RELATION_KEYS = new Set([
  'user',
  'author',
  'editor',
  'createdBy',
  'updatedBy',
]);

const PUBLIC_USER_PII_FIELDS = [
  'email',
  'role',
  'phone',
  'username',
  'lastLogin',
] as const;

@Injectable()
export class ExcludePasswordInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp?.()?.getRequest?.();
    const url: string = req?.originalUrl || req?.url || '';
    const isPrivateAdminRoute = PRIVATE_ADMIN_ROUTE_RE.test(url);

    return next
      .handle()
      .pipe(
        map((data) =>
          this.sanitizePayload(data, new WeakSet(), !isPrivateAdminRoute),
        ),
      );
  }

  private sanitizePayload(
    obj: any,
    visited: WeakSet<object>,
    stripUserRelationPii: boolean,
    isUserRelation = false,
  ): any {
    if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
      return obj;
    }

    if (visited.has(obj)) {
      return obj;
    }

    visited.add(obj);

    if (Array.isArray(obj)) {
      return obj.map((item) =>
        this.sanitizePayload(
          item,
          visited,
          stripUserRelationPii,
          isUserRelation,
        ),
      );
    }

    const newObj: Record<string, any> = { ...obj };
    if ('password' in newObj) {
      delete newObj.password;
    }
    if ('activationTokenHash' in newObj) {
      delete newObj.activationTokenHash;
    }

    if (stripUserRelationPii && isUserRelation) {
      for (const field of PUBLIC_USER_PII_FIELDS) {
        if (field in newObj) {
          delete newObj[field];
        }
      }
    }

    for (const key of Object.keys(newObj)) {
      if (newObj[key] && typeof newObj[key] === 'object') {
        newObj[key] = this.sanitizePayload(
          newObj[key],
          visited,
          stripUserRelationPii,
          USER_RELATION_KEYS.has(key),
        );
      }
    }

    return newObj;
  }
}
