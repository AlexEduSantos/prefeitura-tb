import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface AuditJobData {
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: any;
  ip?: string | null;
  userAgent?: string | null;
  createdAt?: string | Date;
}

export interface AuditFindAllParams {
  page?: number;
  limit?: number;
  action?: string;
  entity?: string;
  userId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('audit') private readonly auditQueue: Queue,
  ) {}

  /**
   * Enfileira o registro de auditoria no BullMQ de forma assíncrona,
   * sem bloquear o ciclo de resposta HTTP da requisição.
   */
  async logAsync(data: AuditJobData): Promise<void> {
    try {
      await this.auditQueue.add('log-entry', data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      });
    } catch (error) {
      this.logger.error('Erro ao enfileirar log de auditoria no BullMQ', error);
      // Fallback: se o Redis estiver indisponível, persiste síncrono para não perder governança
      await this.create(data).catch((err) =>
        this.logger.error('Falha ao persistir log via fallback direto', err),
      );
    }
  }

  /**
   * Grava diretamente o log no banco de dados (consumido pelo worker do BullMQ)
   */
  async create(data: AuditJobData) {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId || null,
        userEmail: data.userEmail || null,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId ? String(data.entityId) : null,
        details: data.details ? data.details : undefined,
        ip: data.ip || null,
        userAgent: data.userAgent || null,
        createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
      },
    });
  }

  /**
   * Retorna os registros paginados com filtros para o painel administrativo
   */
  async findAll(params: AuditFindAllParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.action && params.action !== 'all') {
      where.action = params.action;
    }

    if (params.entity && params.entity !== 'all') {
      where.entity = params.entity;
    }

    if (params.userId) {
      where.userId = params.userId;
    }

    if (params.search) {
      where.OR = [
        { userEmail: { contains: params.search, mode: 'insensitive' } },
        { entityId: { contains: params.search, mode: 'insensitive' } },
        { action: { contains: params.search, mode: 'insensitive' } },
        { entity: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.startDate || params.endDate) {
      const createdAt: { gte?: Date; lte?: Date } = {};
      if (params.startDate) {
        const start = new Date(params.startDate);
        if (!Number.isNaN(start.getTime())) {
          createdAt.gte = start;
        }
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        if (!Number.isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          createdAt.lte = end;
        }
      }
      if (Object.keys(createdAt).length > 0) {
        where.createdAt = createdAt;
      }
    }

    const [total, data] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatar: true,
            },
          },
        },
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    return this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
    });
  }
}
