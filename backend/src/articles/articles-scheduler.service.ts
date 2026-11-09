import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ArticlesSchedulerService {
  private readonly logger = new Logger(ArticlesSchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Executa a cada minuto de forma assíncrona e em segundo plano:
   * 1. Publica artigos 'programado' cuja data de publicação já foi atingida.
   * 2. Expira artigos 'publicado' cuja data de expiração já foi atingida.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleArticleTransitions() {
    const now = new Date();

    try {
      // 1. Transição: programado -> publicado
      const publishedResult = await this.prisma.article.updateMany({
        where: {
          status: 'programado',
          publicationDate: {
            not: null,
            lte: now,
          },
        },
        data: {
          status: 'publicado',
        },
      });

      if (publishedResult.count > 0) {
        this.logger.log(
          `[Scheduler] ${publishedResult.count} artigo(s) programado(s) foram publicados automaticamente.`,
        );
      }

      // 2. Transição: publicado -> expirado
      const expiredResult = await this.prisma.article.updateMany({
        where: {
          status: 'publicado',
          expirationDate: {
            not: null,
            lte: now,
          },
        },
        data: {
          status: 'expirado',
        },
      });

      if (expiredResult.count > 0) {
        this.logger.log(
          `[Scheduler] ${expiredResult.count} artigo(s) publicado(s) foram marcados como expirados.`,
        );
      }
    } catch (error) {
      this.logger.error(
        '[Scheduler] Erro ao processar transições automáticas de artigos:',
        error,
      );
    }
  }

  /**
   * Executa diariamente às 03:00 da manhã:
   * Remove definitivamente (hard delete) artigos com status 'excluido' há mais de 90 dias.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handlePurgeOldDeletedArticles() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    try {
      const purgeResult = await this.prisma.article.deleteMany({
        where: {
          status: 'excluido',
          updatedAt: {
            lte: ninetyDaysAgo,
          },
        },
      });

      if (purgeResult.count > 0) {
        this.logger.log(
          `[Scheduler] Limpeza de 90 dias: ${purgeResult.count} artigo(s) excluído(s) foram removidos definitivamente do banco de dados.`,
        );
      }
    } catch (error) {
      this.logger.error(
        '[Scheduler] Erro ao purgar artigos excluídos com mais de 90 dias:',
        error,
      );
    }
  }
}

