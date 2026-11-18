import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { CreateGalleriesDto } from './dto/create-galleries.dto';
import { UpdateGalleriesDto } from './dto/update-galleries.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Galleries } from '../generated/prisma/client';
import { UserRole } from '../generated/prisma/enums';
import { ApprovalService } from '../approval/approval.service';

@Injectable()
export class GalleriesService {
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
    createGalleriesDto: CreateGalleriesDto,
    userId: string,
    userRole?: UserRole,
  ): Promise<any> {
    const { slides, active, ...galleryData } = createGalleriesDto;

    if (userRole === UserRole.USER) {
      const req = await this.approval.submitChangeRequest({
        entityType: 'Gallery',
        entityId: null,
        requestType: 'create',
        proposedData: {
          ...galleryData,
          active: active ?? true,
          slides,
          userId,
        },
        requestedById: userId,
      });

      return {
        id: req.id,
        ...galleryData,
        active: false,
        userId,
        slides: slides ?? [],
        workflowStatus: 'pendente',
        changeRequestId: req.id,
        pendingRequest: req,
      };
    }

    return this.prisma.galleries.create({
      data: {
        ...galleryData,
        active: active ?? true,
        userId,
        slides: slides
          ? {
              create: slides.map((slide) => ({
                order: slide.order,
                caption: slide.caption,
                link: slide.link,
                media: { connect: { id: slide.mediaId } },
              })),
            }
          : undefined,
      },
    });
  }

  /**
   * Listagem PÚBLICA: apenas galerias ativas e não excluídas.
   */
  async findAll(): Promise<Galleries[]> {
    return this.prisma.galleries.findMany({
      where: {
        active: true,
        deletedAt: null,
      },
      include: {
        organization: true,
        space: true,
        slides: { include: { media: true }, orderBy: { order: 'asc' } },
        user: { select: { name: true, avatar: true } },
      },
    });
  }

  /**
   * Listagem ADMINISTRATIVA: retorna galerias ativas, inativas e pendentes.
   */
  async findAllAdmin(): Promise<any[]> {
    const galleries = await this.prisma.galleries.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        organization: true,
        space: true,
        slides: { include: { media: true }, orderBy: { order: 'asc' } },
        user: { select: { name: true, avatar: true } },
      },
    });
    return this.approval.attachWorkflowMeta('Gallery', galleries);
  }

  /**
   * Detalhe PÚBLICO: somente galeria ativa e não excluída.
   */
  async findOne(id: string): Promise<Galleries> {
    const galleries = await this.prisma.galleries.findFirst({
      where: {
        id,
        active: true,
        deletedAt: null,
      },
      include: {
        organization: true,
        space: true,
        slides: { include: { media: true }, orderBy: { order: 'asc' } },
        user: { select: { name: true, avatar: true } },
      },
    });
    if (!galleries) {
      throw new NotFoundException(`Galeria com ID ${id} não encontrado.`);
    }
    return galleries;
  }

  /**
   * Detalhe ADMINISTRATIVO: busca por ID independente do status.
   */
  async findOneAdmin(id: string): Promise<any> {
    const galleries = await this.prisma.galleries.findUnique({
      where: { id },
      include: {
        organization: true,
        space: true,
        slides: { include: { media: true }, orderBy: { order: 'asc' } },
        user: { select: { name: true, avatar: true } },
      },
    });
    if (!galleries) {
      throw new NotFoundException(`Galeria com ID ${id} não encontrado.`);
    }
    return this.approval.attachWorkflowMetaOne('Gallery', galleries);
  }

  async update(
    id: string,
    updateGalleriesDto: UpdateGalleriesDto,
    userRole?: UserRole,
    userId?: string,
  ): Promise<any> {
    const { slides, ...galleryData } = updateGalleriesDto;

    if (userRole === UserRole.USER) {
      const current = await this.findOneAdmin(id);
      const req = await this.approval.submitChangeRequest({
        entityType: 'Gallery',
        entityId: id,
        requestType: 'update',
        proposedData: {
          ...galleryData,
          ...(slides !== undefined && { slides }),
        },
        requestedById: userId || current.userId,
      });
      return {
        ...current,
        workflowStatus: 'pendente',
        changeRequestId: req.id,
        pendingRequest: req,
      };
    }

    if (slides) {
      return this.prisma.$transaction(async (prisma) => {
        await prisma.galleryMedia.deleteMany({
          where: { galleryId: id },
        });

        return prisma.galleries.update({
          where: { id },
          data: {
            ...galleryData,
            slides: {
              create: slides.map((slide) => ({
                order: slide.order,
                caption: slide.caption,
                link: slide.link,
                media: { connect: { id: slide.mediaId } },
              })),
            },
          },
        });
      });
    }

    return this.prisma.galleries.update({
      where: { id },
      data: galleryData,
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
        entityType: 'Gallery',
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
      return this.prisma.galleries.delete({
        where: { id },
      });
    }

    return this.prisma.galleries.update({
      where: { id },
      data: {
        active: false,
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
      'Gallery',
      id,
      approverId,
      proposedData,
    );
  }

  async reject(id: string, approverId?: string, reason?: string): Promise<any> {
    return this.approval.rejectByEntityOrRequestId(
      'Gallery',
      id,
      approverId,
      reason,
    );
  }
}
