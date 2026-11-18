import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGalleriesDto } from './dto/create-galleries.dto';
import { UpdateGalleriesDto } from './dto/update-galleries.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Galleries, Prisma } from '../generated/prisma/client';
import { UserRole } from '../generated/prisma/enums';

@Injectable()
export class GalleriesService {
  constructor(private prisma: PrismaService) {}

  async create(
    createGalleriesDto: CreateGalleriesDto,
    userId: string,
    userRole?: UserRole,
  ): Promise<Galleries> {
    const { slides, active, ...galleryData } = createGalleriesDto;
    const isCollaborator = userRole === UserRole.USER;
    const resolvedActive = isCollaborator ? false : (active ?? true);
    const workflowStatus = isCollaborator
      ? 'pendente_aprovacao'
      : resolvedActive
        ? 'aprovado'
        : 'rascunho';

    return this.prisma.galleries.create({
      data: {
        ...galleryData,
        active: resolvedActive,
        workflowStatus,
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
  async findAllAdmin(): Promise<Galleries[]> {
    return this.prisma.galleries.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        organization: true,
        space: true,
        slides: { include: { media: true }, orderBy: { order: 'asc' } },
        user: { select: { name: true, avatar: true } },
      },
    });
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
  async findOneAdmin(id: string): Promise<Galleries> {
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
    return galleries;
  }

  async update(
    id: string,
    updateGalleriesDto: UpdateGalleriesDto,
    userRole?: UserRole,
  ): Promise<Galleries> {
    const { slides, ...galleryData } = updateGalleriesDto;

    if (userRole === UserRole.USER) {
      const current = await this.findOneAdmin(id);
      if (current.active) {
        return this.prisma.galleries.update({
          where: { id },
          data: {
            workflowStatus: 'pendente_aprovacao',
            pendingAction: {
              type: 'update',
              data: {
                ...galleryData,
                ...(slides !== undefined && { slides }),
              },
              requestedAt: new Date().toISOString(),
            } as unknown as Prisma.InputJsonValue,
          },
        });
      }
      galleryData.active = false;
    }

    const extraWorkflow =
      userRole === UserRole.USER
        ? { workflowStatus: 'pendente_aprovacao' }
        : {
            pendingAction: Prisma.DbNull,
            ...(galleryData.active !== undefined && {
              workflowStatus: galleryData.active ? 'aprovado' : 'rascunho',
            }),
          };

    if (slides) {
      return this.prisma.$transaction(async (prisma) => {
        await prisma.galleryMedia.deleteMany({
          where: { galleryId: id },
        });

        return prisma.galleries.update({
          where: { id },
          data: {
            ...galleryData,
            ...extraWorkflow,
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
      data: {
        ...galleryData,
        ...extraWorkflow,
      },
    });
  }

  async remove(
    id: string,
    userRole?: UserRole,
    hardDelete = false,
  ): Promise<Galleries> {
    if (userRole === UserRole.USER) {
      await this.findOneAdmin(id);
      return this.prisma.galleries.update({
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
      return this.prisma.galleries.delete({
        where: { id },
      });
    }

    return this.prisma.galleries.update({
      where: { id },
      data: {
        active: false,
        deletedAt: new Date(),
        workflowStatus: 'excluido',
        pendingAction: Prisma.DbNull,
      },
    });
  }

  async approve(id: string, approverId?: string): Promise<Galleries> {
    const current = await this.findOneAdmin(id);
    const pending = current.pendingAction as {
      type?: string;
      data?: Record<string, any>;
    } | null;

    if (pending?.type === 'delete') {
      return this.prisma.galleries.update({
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
      const { slides, ...galleryData } = pending.data;
      if (Array.isArray(slides)) {
        return this.prisma.$transaction(async (prisma) => {
          await prisma.galleryMedia.deleteMany({
            where: { galleryId: id },
          });

          return prisma.galleries.update({
            where: { id },
            data: {
              ...galleryData,
              active:
                galleryData.active !== undefined
                  ? Boolean(galleryData.active)
                  : true,
              deletedAt: null,
              workflowStatus: 'aprovado',
              pendingAction: Prisma.DbNull,
              approvedById: approverId ?? null,
              approvedAt: new Date(),
              slides: {
                create: slides.map((slide: any) => ({
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
        data: {
          ...galleryData,
          active:
            galleryData.active !== undefined
              ? Boolean(galleryData.active)
              : true,
          deletedAt: null,
          workflowStatus: 'aprovado',
          pendingAction: Prisma.DbNull,
          approvedById: approverId ?? null,
          approvedAt: new Date(),
        },
      });
    }

    return this.prisma.galleries.update({
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

  async reject(id: string, approverId?: string): Promise<Galleries> {
    await this.findOneAdmin(id);
    return this.prisma.galleries.update({
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
