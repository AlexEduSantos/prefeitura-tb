import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ExcludePasswordInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next
      .handle()
      .pipe(map((data) => this.removePassword(data, new WeakSet())));
  }

  private removePassword(obj: any, visited: WeakSet<object>): any {
    // 1. Casos base: null, não-objetos, instâncias de Date, ou se já visitamos
    if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
      return obj;
    }

    if (visited.has(obj)) {
      return obj; // Já processado, retorna para evitar loop
    }

    // Marca como visitado
    visited.add(obj);

    // 2. Lida com Arrays
    if (Array.isArray(obj)) {
      return obj.map((item) => this.removePassword(item, visited));
    }

    // 3. Lida com Objetos
    const newObj = { ...obj };
    if ('password' in newObj) {
      delete newObj.password;
    }

    for (const key in newObj) {
      if (newObj[key] && typeof newObj[key] === 'object') {
        newObj[key] = this.removePassword(newObj[key], visited);
      }
    }

    return newObj;
  }
}
