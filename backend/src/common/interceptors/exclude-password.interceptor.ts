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
    return next.handle().pipe(
      map((data) => this.removePassword(data)),
    );
  }

  // Função recursiva para encontrar e remover o campo "password" de qualquer objeto ou array retornado
  private removePassword(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.removePassword(item));
    }

    const newObj = { ...obj };
    if ('password' in newObj) {
      delete newObj.password;
    }

    for (const key in newObj) {
      if (newObj[key] && typeof newObj[key] === 'object') {
        newObj[key] = this.removePassword(newObj[key]);
      }
    }

    return newObj;
  }
}
