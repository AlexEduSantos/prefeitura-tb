import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '../../generated/prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    switch (exception.code) {
      // P2003: Violação de chave estrangeira (Foreign Key Constraint)
      case 'P2003': {
        const status = HttpStatus.CONFLICT; // 409 Conflict ou 400 Bad Request
        response.status(status).json({
          statusCode: status,
          message:
            'Não é possível excluir o item pois ele está sendo utilizado por outro módulo (Serviços).',
          error: 'Conflict',
        });
        break;
      }

      // P2002: Campo único duplicado (Unique constraint)
      case 'P2002': {
        const status = HttpStatus.BAD_REQUEST;
        response.status(status).json({
          statusCode: status,
          message: 'Já existe um registro cadastrado com esses dados.',
          error: 'Bad Request',
        });
        break;
      }

      // P2025: Registro não encontrado para exclusão/atualização
      case 'P2025': {
        const status = HttpStatus.NOT_FOUND;
        response.status(status).json({
          statusCode: status,
          message: 'Registro não encontrado no banco de dados.',
          error: 'Not Found',
        });
        break;
      }

      default:
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Erro inesperado no banco de dados.',
        });
        break;
    }
  }
}
