import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-services.dto';
import { UpdateServiceDto } from './dto/update-serviecs.dto';
import { Prisma, Services } from '../generated/prisma/client';
import { UserRole } from '../generated/prisma/enums';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    createServiceDto: CreateServiceDto,
    userId: string,
    userRole?: UserRole,
  ) {
    const isCollaborator = userRole === UserRole.USER;
    return this.prisma.services.create({
      data: {
        ...createServiceDto,
        active: isCollaborator ? false : true,
        workflowStatus: isCollaborator ? 'pendente_aprovacao' : 'aprovado',
        userId,
      },
    });
  }

  findAll(): Promise<Services[]> {
    return this.prisma.services.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        organization: true,
        image: true,
        user: { select: { name: true, avatar: true } },
      },
    });
  }

  async findAllPublic(page?: string, limit?: string, title?: string) {
    const parsedPage = Math.max(1, parseInt(page as string, 10) || 1);
    const parsedLimit = Math.min(
      100,
      Math.max(1, parseInt(limit as string, 10) || 10),
    );
    const skip = (parsedPage - 1) * parsedLimit;

    const where: any = {
      active: true,
      deletedAt: null,
    };
    if (title && title.trim() !== '') {
      where.title = {
        contains: title.trim(),
        mode: 'insensitive',
      };
    }

    const [services, total] = await Promise.all([
      this.prisma.services.findMany({
        where,
        skip,
        take: parsedLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          organization: true,
          image: true,
          user: { select: { name: true, avatar: true } },
        },
      }),
      this.prisma.services.count({
        where,
      }),
    ]);

    return {
      services,
      meta: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit),
      },
    };
  }

  async findOne(id: string) {
    const service = await this.prisma.services.findUnique({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Serviço com ID ${id} não encontrado.`);
    }
    return service;
  }

  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
    _userId?: string,
    userRole?: UserRole,
  ) {
    if (userRole === UserRole.USER) {
      const current = await this.findOne(id);
      if (current.active) {
        return this.prisma.services.update({
          where: { id },
          data: {
            workflowStatus: 'pendente_aprovacao',
            pendingAction: {
              type: 'update',
              data: { ...updateServiceDto },
              requestedAt: new Date().toISOString(),
            },
          },
        });
      }

      return this.prisma.services.update({
        where: { id },
        data: {
          ...updateServiceDto,
          active: false,
          workflowStatus: 'pendente_aprovacao',
        },
      });
    }

    if (userRole === UserRole.ADMIN || userRole === UserRole.MANAGER) {
      return this.prisma.services.update({
        where: { id },
        data: {
          ...updateServiceDto,
          workflowStatus: 'aprovado',
          pendingAction: Prisma.DbNull,
        },
      });
    }

    return this.prisma.services.update({
      where: { id },
      data: { ...updateServiceDto },
    });
  }

  async remove(id: string, userRole?: UserRole, hardDelete = false) {
    if (userRole === UserRole.USER) {
      await this.findOne(id);
      return this.prisma.services.update({
        where: { id },
        data: {
          workflowStatus: 'pendente_aprovacao',
          pendingAction: {
            type: 'delete',
            requestedAt: new Date().toISOString(),
          },
        },
      });
    }

    if (userRole === UserRole.ADMIN && hardDelete) {
      return this.prisma.services.delete({ where: { id } });
    }

    return this.prisma.services.update({
      where: { id },
      data: {
        active: false,
        deletedAt: new Date(),
        workflowStatus: 'excluido',
        pendingAction: Prisma.DbNull,
      },
    });
  }

  async approve(id: string, approverId?: string) {
    const current = await this.findOne(id);
    const pending = current.pendingAction as {
      type?: string;
      data?: Record<string, any>;
    } | null;

    if (pending?.type === 'delete') {
      return this.prisma.services.update({
        where: { id },
        data: {
          active: false,
          deletedAt: new Date(),
          workflowStatus: 'excluido',
          pendingAction: Prisma.DbNull,
          approvedById: approverId ?? null,
          approvedAt: new Date(),
        },
      });
    }

    if (pending?.type === 'update' && pending.data) {
      return this.prisma.services.update({
        where: { id },
        data: {
          ...pending.data,
          active: true,
          deletedAt: null,
          workflowStatus: 'aprovado',
          pendingAction: Prisma.DbNull,
          approvedById: approverId ?? null,
          approvedAt: new Date(),
        },
      });
    }

    return this.prisma.services.update({
      where: { id },
      data: {
        active: true,
        deletedAt: null,
        workflowStatus: 'aprovado',
        pendingAction: Prisma.DbNull,
        approvedById: approverId ?? null,
        approvedAt: new Date(),
      },
    });
  }

  async reject(id: string, approverId?: string) {
    await this.findOne(id);
    return this.prisma.services.update({
      where: { id },
      data: {
        workflowStatus: 'rejeitado',
        pendingAction: Prisma.DbNull,
        approvedById: approverId ?? null,
        approvedAt: new Date(),
      },
    });
  }
}
