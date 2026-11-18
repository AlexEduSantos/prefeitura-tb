import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { CreatePopupDto } from './dto/create-popup.dto';
import { UpdatePopupDto } from './dto/update-popup.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Popups } from '../generated/prisma/client';
import { UserRole } from '../generated/prisma/enums';
import { ApprovalService } from '../approval/approval.service';

@Injectable()
export class PopupsService {
  constructor(
    private prisma: PrismaService,
    @Optional() private approvalService?: ApprovalService,
  ) {}

  private get approval(): ApprovalService {
    if (!this.approvalService) {
      this.approvalService = new ApprovalService(this.prisma);
    }
    return this.approvalService;
  }

  async create(
    createPopupDto: CreatePopupDto,
    userId: string,
    userRole?: UserRole,
  ): Promise<any> {
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

    if (userRole === UserRole.USER) {
      const req = await this.approval.submitChangeRequest({
        entityType: 'Popup',
        entityId: null,
        requestType: 'create',
        proposedData: {
          ...createPopupDto,
          active: active ?? true,
          status: status ?? 'publicado',
          userId,
        },
        requestedById: userId,
      });

      return {
        id: req.id,
        title,
        imageId,
        userId,
        active: false,
        status: 'rascunho',
        workflowStatus: 'pendente',
        changeRequestId: req.id,
        pendingRequest: req,
      };
    }

    const data: any = {
      title,
      imageId,
      userId,
      active: active ?? true,
      status: status ?? 'rascunho',
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
  async findAllAdmin(): Promise<any[]> {
    const popups = await this.prisma.popups.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        organization: true,
        space: true,
        image: true,
        user: { select: { name: true, avatar: true } },
      },
    });
    return this.approval.attachWorkflowMeta('Popup', popups);
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
  async findOneAdmin(id: string): Promise<any> {
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
    return this.approval.attachWorkflowMetaOne('Popup', popup);
  }

  async update(
    id: string,
    updatePopupDto: UpdatePopupDto,
    userRole?: UserRole,
    userId?: string,
  ): Promise<any> {
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
      const req = await this.approval.submitChangeRequest({
        entityType: 'Popup',
        entityId: id,
        requestType: 'update',
        proposedData: data,
        requestedById: userId || current.userId,
      });
      return {
        ...current,
        workflowStatus: 'pendente',
        changeRequestId: req.id,
        pendingRequest: req,
      };
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
    userId?: string,
  ): Promise<any> {
    if (userRole === UserRole.USER) {
      const current = await this.findOneAdmin(id);
      const req = await this.approval.submitChangeRequest({
        entityType: 'Popup',
        entityId: id,
        requestType: 'delete',
        proposedData: { title: current.title },
        requestedById: userId || current.userId,
      });
      return {
        ...current,
        workflowStatus: 'pendente',
        changeRequestId: req.id,
        pendingRequest: req,
      };
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
      },
    });
  }

  async approve(
    id: string,
    approverId?: string,
    proposedData?: Record<string, any>,
  ): Promise<any> {
    return this.approval.approveByEntityOrRequestId(
      'Popup',
      id,
      approverId,
      proposedData,
    );
  }

  async reject(id: string, approverId?: string, reason?: string): Promise<any> {
    return this.approval.rejectByEntityOrRequestId(
      'Popup',
      id,
      approverId,
      reason,
    );
  }
}
