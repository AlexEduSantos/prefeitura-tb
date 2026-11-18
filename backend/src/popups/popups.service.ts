import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePopupDto } from './dto/create-popup.dto';
import { UpdatePopupDto } from './dto/update-popup.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Popups, Prisma } from '../generated/prisma/client';
import { UserRole } from '../generated/prisma/enums';

@Injectable()
export class PopupsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createPopupDto: CreatePopupDto,
    userId: string,
    userRole?: UserRole,
  ): Promise<Popups> {
    const {
      title,
      imageId,
      link,
      active,
      displayTime,
      status,
      type,
      position,
      closeButton,
      priority,
      publicationDate,
      expirationDate,
      organizationId,
      spaceId,
    } = createPopupDto;

    const isCollaborator = userRole === UserRole.USER;
    const resolvedActive = isCollaborator ? false : (active ?? true);
    const resolvedStatus = isCollaborator ? 'rascunho' : (status ?? 'rascunho');
    const workflowStatus = isCollaborator
      ? 'pendente_aprovacao'
      : resolvedActive && resolvedStatus === 'publicado'
        ? 'aprovado'
        : 'rascunho';

    const data: any = {
      title,
      imageId,
      userId,
      active: resolvedActive,
      status: resolvedStatus,
      workflowStatus,
      ...(link !== undefined && { link }),
      ...(displayTime !== undefined && { displayTime }),
      ...(type !== undefined && { type }),
      ...(position !== undefined && { position }),
      ...(closeButton !== undefined && { closeButton }),
      ...(priority !== undefined && { priority }),
      ...(organizationId !== undefined && {
        organizationId: organizationId || null,
      }),
      ...(spaceId !== undefined && { spaceId: spaceId || null }),
    };

    if (publicationDate) {
      data.publicationDate = new Date(publicationDate);
    }
    if (expirationDate) {
      data.expirationDate = new Date(expirationDate);
    }

    return this.prisma.popups.create({
      data,
    });
  }

  /**
   * Listagem PÚBLICA: apenas popups ativos, publicados, não removidos e vigentes.
   */
  async findAll(): Promise<Popups[]> {
    const now = new Date();
    return this.prisma.popups.findMany({
      where: {
        active: true,
        status: 'publicado',
        deletedAt: null,
        OR: [{ publicationDate: null }, { publicationDate: { lte: now } }],
        AND: [
          {
            OR: [{ expirationDate: null }, { expirationDate: { gt: now } }],
          },
        ],
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      include: {
        organization: true,
        space: true,
        image: true,
        user: { select: { name: true, avatar: true } },
      },
    });
  }

  /**
   * Listagem ADMINISTRATIVA: retorna todos os popups não removidos fisicamente.
   */
  async findAllAdmin(): Promise<Popups[]> {
    return this.prisma.popups.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        organization: true,
        space: true,
        image: true,
        user: { select: { name: true, avatar: true } },
      },
    });
  }

  /**
   * Detalhe PÚBLICO: restringe por ativo/publicado/vigente.
   */
  async findOne(id: string): Promise<Popups> {
    const now = new Date();
    const popup = await this.prisma.popups.findFirst({
      where: {
        id,
        active: true,
        status: 'publicado',
        deletedAt: null,
        OR: [{ publicationDate: null }, { publicationDate: { lte: now } }],
        AND: [
          {
            OR: [{ expirationDate: null }, { expirationDate: { gt: now } }],
          },
        ],
      },
      include: {
        organization: true,
        space: true,
        image: true,
        user: { select: { name: true, avatar: true } },
      },
    });
    if (!popup) {
      throw new NotFoundException(`Popup com ID ${id} não encontrado.`);
    }
    return popup;
  }

  /**
   * Detalhe ADMINISTRATIVO: busca por ID independente de status.
   */
  async findOneAdmin(id: string): Promise<Popups> {
    const popup = await this.prisma.popups.findUnique({
      where: { id },
      include: {
        organization: true,
        space: true,
        image: true,
        user: { select: { name: true, avatar: true } },
      },
    });
    if (!popup) {
      throw new NotFoundException(`Popup com ID ${id} não encontrado.`);
    }
    return popup;
  }

  async update(
    id: string,
    updatePopupDto: UpdatePopupDto,
    userRole?: UserRole,
  ): Promise<Popups> {
    const {
      title,
      link,
      active,
      displayTime,
      status,
      type,
      position,
      closeButton,
      priority,
      publicationDate,
      expirationDate,
      imageId,
      organizationId,
      spaceId,
    } = updatePopupDto as any;

    const data: Record<string, any> = {};

    if (title !== undefined) data.title = title;
    if (link !== undefined) data.link = link;
    if (active !== undefined) data.active = active;
    if (displayTime !== undefined) data.displayTime = displayTime;
    if (status !== undefined) data.status = status;
    if (type !== undefined) data.type = type;
    if (position !== undefined) data.position = position;
    if (closeButton !== undefined) data.closeButton = closeButton;
    if (priority !== undefined) data.priority = priority;
    if (publicationDate !== undefined)
      data.publicationDate = new Date(publicationDate);
    if (expirationDate !== undefined)
      data.expirationDate = new Date(expirationDate);
    if (imageId !== undefined) data.imageId = imageId;
    if (organizationId !== undefined)
      data.organizationId = organizationId || null;
    if (spaceId !== undefined) data.spaceId = spaceId || null;

    if (userRole === UserRole.USER) {
      const current = await this.findOneAdmin(id);
      if (current.active && current.status === 'publicado') {
        return this.prisma.popups.update({
          where: { id },
          data: {
            workflowStatus: 'pendente_aprovacao',
            pendingAction: {
              type: 'update',
              data,
              requestedAt: new Date().toISOString(),
            },
          },
        });
      }

      data.active = false;
      data.status = 'rascunho';
      data.workflowStatus = 'pendente_aprovacao';
    } else {
      data.pendingAction = Prisma.DbNull;
      if (status === 'publicado' || active === true) {
        data.workflowStatus = 'aprovado';
      }
    }

    return this.prisma.popups.update({
      where: { id },
      data,
    });
  }

  async remove(
    id: string,
    userRole?: UserRole,
    hardDelete = false,
  ): Promise<Popups> {
    if (userRole === UserRole.USER) {
      await this.findOneAdmin(id);
      return this.prisma.popups.update({
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
      return this.prisma.popups.delete({
        where: { id },
      });
    }

    return this.prisma.popups.update({
      where: { id },
      data: {
        active: false,
        status: 'excluido',
        deletedAt: new Date(),
        workflowStatus: 'excluido',
        pendingAction: Prisma.DbNull,
      },
    });
  }

  async approve(id: string, approverId?: string): Promise<Popups> {
    const current = await this.findOneAdmin(id);
    const pending = current.pendingAction as {
      type?: string;
      data?: Record<string, any>;
    } | null;

    if (pending?.type === 'delete') {
      return this.prisma.popups.update({
        where: { id },
        data: {
          active: false,
          status: 'excluido',
          deletedAt: new Date(),
          workflowStatus: 'excluido',
          pendingAction: Prisma.DbNull,
          approvedById: approverId ?? null,
          approvedAt: new Date(),
        },
      });
    }

    if (pending?.type === 'update' && pending.data) {
      return this.prisma.popups.update({
        where: { id },
        data: {
          ...pending.data,
          active:
            pending.data.active !== undefined
              ? Boolean(pending.data.active)
              : true,
          status: pending.data.status || 'publicado',
          deletedAt: null,
          workflowStatus: 'aprovado',
          pendingAction: Prisma.DbNull,
          approvedById: approverId ?? null,
          approvedAt: new Date(),
        },
      });
    }

    return this.prisma.popups.update({
      where: { id },
      data: {
        active: true,
        status: 'publicado',
        deletedAt: null,
        workflowStatus: 'aprovado',
        pendingAction: Prisma.DbNull,
        approvedById: approverId ?? null,
        approvedAt: new Date(),
      },
    });
  }

  async reject(id: string, approverId?: string): Promise<Popups> {
    await this.findOneAdmin(id);
    return this.prisma.popups.update({
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
