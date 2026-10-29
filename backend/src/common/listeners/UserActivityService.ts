import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserActivityListener {
  private readonly logger = new Logger(UserActivityListener.name);

  constructor(private prisma: PrismaService) {}

  // ✅ O decorator @OnEvent escuta o evento que disparamos no controller
  @OnEvent('login.success')
  async handleLoginSuccess(userId: string) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastLogin: new Date() },
      });
      this.logger.log(`Last login atualizado para o usuário ${userId}`);
    } catch (error) {
      // Se der erro, apenas logamos. O login do usuário NÃO é afetado.
      this.logger.error(
        `Falha ao atualizar lastLogin do usuário ${userId}`,
        error,
      );
    }
  }
}
