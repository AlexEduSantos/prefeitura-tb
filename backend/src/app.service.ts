import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Sistema de Gestão Pública - Prefeitura de Telêmaco Borba';
  }
}
