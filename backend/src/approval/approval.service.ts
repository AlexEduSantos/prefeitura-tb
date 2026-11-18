import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisCacheService } from '../common/cache/redis-cache.service';
import { Prisma } from '../generated/prisma/client';
import { RequestType, UserRole } from '../generated/prisma/enums';

export interface SubmitChangeRequestInput {
  entityType: string;
  entityId?: string | null;
  requestType: RequestType | 'create' | 'update' | 'delete';
  proposedData?: Record<string, any> | null;
  requestedById?: string;
}

export interface FindApprovalFilters {
  status?: string;
  entityType?: string;
  requestedById?: string;
  page?: number;
  limit?: number;
}

const ENTITY_TYPE_MAP: Record<string, string> = {
  page: 'Page',
  pages: 'Page',
  article: 'Article',
  articles: 'Article',
  popup: 'Popup',
  popups: 'Popup',
  gallery: 'Gallery',
  galleries: 'Gallery',
  service: 'Service',
  services: 'Service',
  story: 'Story',
  stories: 'Story',
  menu: 'Menu',
  menus: 'Menu',
  menuitem: 'MenuItem',
  organization: 'Organization',
  organizations: 'Organization',
};

const PAGE_SCALAR_FIELDS = [
  'title',
  'slug',
  'content',
  'description',
  'published',
  'spaceId',
  'organizationId',
] as const;

const ARTICLE_SCALAR_FIELDS = [
  'title',
  'headline',
  'body',
  'slug',
  'type',
  'status',
  'publicationDate',
  'expirationDate',
  'featured',
  'seoTitle',
  'seoDescription',
  'seoKeywords',
  'allowComments',
  'tags',
  'visibility',
  'galleryId',
  'socialPreviewTitle',
  'socialPreviewImage',
  'socialPreviewDescription',
  'organizationId',
  'editorId',
  'coverId',
] as const;

const POPUP_SCALAR_FIELDS = [
  'title',
  'link',
  'active',
  'displayTime',
  'status',
  'type',
  'position',
  'closeButton',
  'priority',
  'publicationDate',
  'expirationDate',
  'spaceId',
  'organizationId',
  'imageId',
] as const;

const GALLERY_SCALAR_FIELDS = [
  'title',
  'active',
  'galleryType',
  'galleryAutoplay',
  'galleryInterval',
  'galleryShowThumbnails',
  'spaceId',
  'organizationId',
] as const;

const SERVICE_SCALAR_FIELDS = [
  'title',
  'link',
  'altText',
  'active',
  'featured',
  'description',
  'organizationId',
  'imageId',
] as const;

const APPROVAL_USER_INCLUDE = {
  requestedBy: {
    select: { id: true, name: true, email: true, avatar: true, role: true },
  },
  reviewedBy: {
    select: { id: true, name: true, email: true, avatar: true, role: true },
  },
} as const;

/**
 * Serviço centralizado de solicitações de mudança e aprovação editorial (`ContentChangeRequest`).
 */
@Injectable()
export class ApprovalService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly cacheService?: RedisCacheService,
  ) {}

  normalizeEntityType(entityType: string): string {
    const key = String(entityType || '')
      .trim()
      .toLowerCase();
    return ENTITY_TYPE_MAP[key] ?? entityType.trim();
  }

  private pickFields(
    source: Record<string, any>,
    allowed: readonly string[],
  ): Record<string, any> {
    const picked: Record<string, any> = {};
    for (const key of allowed) {
      if (source[key] !== undefined) {
        picked[key] = source[key];
      }
    }
    return picked;
  }

  private normalizeNullableUuidFields(
    data: Record<string, any>,
    fields: string[],
  ) {
    for (const field of fields) {
      if (field in data && !data[field]) {
        data[field] = null;
      }
    }
  }

  private resolveArticleStatus(
    status: string | undefined,
    publicationDate: Date | null,
  ): any {
    const now = new Date();
    if (status === 'publicado' || status === 'programado') {
      if (publicationDate && publicationDate > now) {
        return 'programado';
      }
      return 'publicado';
    }
    return status || 'rascunho';
  }

  /**
   * Registra uma nova solicitação de criação, edição ou exclusão para análise de MANAGER/ADMIN.
   */
  async submitChangeRequest(input: SubmitChangeRequestInput) {
    if (!input.requestedById) {
      throw new BadRequestException(
        'Usuário autenticado não identificado para registrar a solicitação.',
      );
    }

    const entityType = this.normalizeEntityType(input.entityType);

    if (input.entityId && this.prisma.contentChangeRequest?.findFirst) {
      const existingPending = await this.prisma.contentChangeRequest.findFirst({
        where: {
          entityType,
          entityId: input.entityId,
          status: 'pendente',
        },
      });
      if (existingPending) {
        throw new ConflictException(
          'Já existe uma solicitação pendente de aprovação para este registro.',
        );
      }
    }

    return this.prisma.contentChangeRequest.create({
      data: {
        entityType,
        entityId: input.entityId ?? null,
        requestType: input.requestType,
        proposedData:
          input.proposedData !== undefined && input.proposedData !== null
            ? (input.proposedData as Prisma.InputJsonValue)
            : Prisma.DbNull,
        status: 'pendente',
        requestedById: input.requestedById,
      },
      include: APPROVAL_USER_INCLUDE,
    });
  }

  /**
   * Anexa metadados derivados (`workflowStatus`, `pendingRequest`, `lastRejectedRequest`) a uma lista de entidades.
   */
  async attachWorkflowMeta<T extends { id: string }>(
    entityType: string,
    items: T[],
  ): Promise<
    Array<
      T & {
        workflowStatus: 'pendente' | 'rejeitado' | 'aprovado';
        pendingRequest: Record<string, any> | null;
        lastRejectedRequest: Record<string, any> | null;
      }
    >
  > {
    if (!items.length || !this.prisma.contentChangeRequest?.findMany) {
      return items.map((item) => ({
        ...item,
        workflowStatus: 'aprovado' as const,
        pendingRequest: null,
        lastRejectedRequest: null,
      }));
    }

    const normalizedType = this.normalizeEntityType(entityType);
    const ids = items.map((item) => item.id).filter(Boolean);
    const requests = await this.prisma.contentChangeRequest.findMany({
      where: {
        entityType: normalizedType,
        entityId: { in: ids },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        requestedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        reviewedBy: {
          select: { id: true, name: true },
        },
      },
    });

    const grouped = new Map<string, any[]>();
    for (const req of requests) {
      if (!req.entityId) continue;
      const list = grouped.get(req.entityId) ?? [];
      list.push(req);
      grouped.set(req.entityId, list);
    }

    return items.map((item) => {
      const reqs = grouped.get(item.id) ?? [];
      const pendingRequest = reqs.find((r) => r.status === 'pendente') ?? null;
      const latest = reqs[0] ?? null;
      const lastRejectedRequest =
        !pendingRequest && latest?.status === 'rejeitado' ? latest : null;
      const workflowStatus = pendingRequest
        ? ('pendente' as const)
        : lastRejectedRequest
          ? ('rejeitado' as const)
          : ('aprovado' as const);

      return {
        ...item,
        workflowStatus,
        pendingRequest,
        lastRejectedRequest,
      };
    });
  }

  async attachWorkflowMetaOne<T extends { id: string }>(
    entityType: string,
    item: T,
  ) {
    const [enriched] = await this.attachWorkflowMeta(entityType, [item]);
    return enriched;
  }

  private async fetchCurrentEntity(
    entityType: string,
    entityId: string | null | undefined,
  ): Promise<Record<string, any> | null> {
    if (!entityId) return null;
    const normalized = this.normalizeEntityType(entityType);

    try {
      switch (normalized) {
        case 'Page':
          return (
            (await this.prisma.page?.findUnique({
              where: { id: entityId },
              include: { organization: true, space: true },
            })) ?? null
          );
        case 'Article':
          return (
            (await this.prisma.article?.findUnique({
              where: { id: entityId },
              include: { organization: true, categories: true },
            })) ?? null
          );
        case 'Popup':
          return (
            (await this.prisma.popups?.findUnique({
              where: { id: entityId },
              include: { organization: true, space: true, image: true },
            })) ?? null
          );
        case 'Gallery':
          return (
            (await this.prisma.galleries?.findUnique({
              where: { id: entityId },
              include: {
                organization: true,
                space: true,
                slides: { include: { media: true }, orderBy: { order: 'asc' } },
              },
            })) ?? null
          );
        case 'Service':
          return (
            (await this.prisma.services?.findUnique({
              where: { id: entityId },
              include: { organization: true, image: true },
            })) ?? null
          );
        case 'Story':
          return (
            (await this.prisma.stories?.findUnique({
              where: { id: entityId },
            })) ?? null
          );
        case 'Menu':
          return (
            (await this.prisma.menu?.findUnique({ where: { id: entityId } })) ??
            null
          );
        case 'MenuItem':
          return (
            (await this.prisma.menuItem?.findUnique({
              where: { id: entityId },
            })) ?? null
          );
        case 'Organization':
          return (
            (await this.prisma.organization?.findUnique({
              where: { id: entityId },
            })) ?? null
          );
        default:
          return null;
      }
    } catch {
      return null;
    }
  }

  private async fetchCurrentEntitiesMap(
    items: Array<{ entityType: string; entityId: string | null }>,
  ): Promise<Map<string, Record<string, any>>> {
    const byType = new Map<string, Set<string>>();
    for (const item of items) {
      if (!item.entityId) continue;
      const type = this.normalizeEntityType(item.entityType);
      const set = byType.get(type) ?? new Set<string>();
      set.add(item.entityId);
      byType.set(type, set);
    }

    const resultMap = new Map<string, Record<string, any>>();
    const lookup = async (
      type: string,
      ids: string[],
    ): Promise<Array<Record<string, any>>> => {
      switch (type) {
        case 'Page':
          return (
            (await this.prisma.page?.findMany({
              where: { id: { in: ids } },
              include: { organization: true, space: true },
            })) ?? []
          );
        case 'Article':
          return (
            (await this.prisma.article?.findMany({
              where: { id: { in: ids } },
              include: { organization: true, categories: true },
            })) ?? []
          );
        case 'Popup':
          return (
            (await this.prisma.popups?.findMany({
              where: { id: { in: ids } },
              include: { organization: true, space: true },
            })) ?? []
          );
        case 'Gallery':
          return (
            (await this.prisma.galleries?.findMany({
              where: { id: { in: ids } },
              include: {
                organization: true,
                space: true,
                slides: { orderBy: { order: 'asc' } },
              },
            })) ?? []
          );
        case 'Service':
          return (
            (await this.prisma.services?.findMany({
              where: { id: { in: ids } },
              include: { organization: true },
            })) ?? []
          );
        case 'Story':
          return (
            (await this.prisma.stories?.findMany({
              where: { id: { in: ids } },
            })) ?? []
          );
        case 'Menu':
          return (
            (await this.prisma.menu?.findMany({
              where: { id: { in: ids } },
            })) ?? []
          );
        case 'MenuItem':
          return (
            (await this.prisma.menuItem?.findMany({
              where: { id: { in: ids } },
            })) ?? []
          );
        case 'Organization':
          return (
            (await this.prisma.organization?.findMany({
              where: { id: { in: ids } },
            })) ?? []
          );
        default:
          return [];
      }
    };

    for (const [type, idSet] of byType.entries()) {
      const ids = Array.from(idSet);
      if (!ids.length) continue;
      const entities = await lookup(type, ids);
      for (const entity of entities) {
        if (entity?.id) {
          resultMap.set(`${type}:${entity.id}`, entity);
        }
      }
    }

    return resultMap;
  }

  /**
   * Lista solicitações para a fila centralizada de aprovações, anexando o snapshot atual da entidade.
   */
  async findAllRequests(filters: FindApprovalFilters = {}) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ContentChangeRequestWhereInput = {};
    if (filters.status && filters.status !== 'todos') {
      where.status = filters.status as any;
    }
    if (filters.entityType && filters.entityType !== 'todos') {
      where.entityType = this.normalizeEntityType(filters.entityType);
    }
    if (filters.requestedById) {
      where.requestedById = filters.requestedById;
    }

    const baseCountWhere: Prisma.ContentChangeRequestWhereInput =
      filters.requestedById ? { requestedById: filters.requestedById } : {};

    const [items, total, pendingCount, rejectedCount, approvedCount] =
      await Promise.all([
        this.prisma.contentChangeRequest.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: APPROVAL_USER_INCLUDE,
        }),
        this.prisma.contentChangeRequest.count({ where }),
        this.prisma.contentChangeRequest.count({
          where: { ...baseCountWhere, status: 'pendente' },
        }),
        this.prisma.contentChangeRequest.count({
          where: { ...baseCountWhere, status: 'rejeitado' },
        }),
        this.prisma.contentChangeRequest.count({
          where: { ...baseCountWhere, status: 'aprovado' },
        }),
      ]);

    const entityMap = await this.fetchCurrentEntitiesMap(items);
    const enriched = items.map((item) => {
      const key = item.entityId
        ? `${this.normalizeEntityType(item.entityType)}:${item.entityId}`
        : null;
      return {
        ...item,
        currentEntity: key ? (entityMap.get(key) ?? null) : null,
      };
    });

    return {
      items: enriched,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      summary: {
        pendente: pendingCount,
        rejeitado: rejectedCount,
        aprovado: approvedCount,
      },
    };
  }

  async findOneRequest(id: string, actor?: { id?: string; role?: UserRole }) {
    const request = await this.prisma.contentChangeRequest.findUnique({
      where: { id },
      include: APPROVAL_USER_INCLUDE,
    });
    if (!request) {
      throw new NotFoundException(`Solicitação ${id} não encontrada.`);
    }
    if (
      actor?.role === UserRole.USER &&
      actor.id &&
      request.requestedById !== actor.id
    ) {
      throw new ForbiddenException(
        'Você só pode visualizar suas próprias solicitações.',
      );
    }
    const currentEntity = await this.fetchCurrentEntity(
      request.entityType,
      request.entityId,
    );
    return {
      ...request,
      currentEntity,
    };
  }

  async updateProposedData(
    id: string,
    proposedData: Record<string, any>,
    actor: { id?: string; role?: UserRole },
  ) {
    const request = await this.prisma.contentChangeRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException(`Solicitação ${id} não encontrada.`);
    }
    if (
      actor.role === UserRole.USER &&
      actor.id &&
      request.requestedById !== actor.id
    ) {
      throw new ForbiddenException(
        'Você só pode alterar suas próprias solicitações.',
      );
    }
    if (request.status !== 'pendente') {
      throw new BadRequestException(
        'Apenas solicitações pendentes podem ser editadas.',
      );
    }

    const mergedData = {
      ...((request.proposedData as Record<string, any>) || {}),
      ...proposedData,
    };

    return this.prisma.contentChangeRequest.update({
      where: { id },
      data: {
        proposedData: mergedData,
      },
      include: APPROVAL_USER_INCLUDE,
    });
  }

  /**
   * Reenvia uma proposta rejeitada criando um novo registro pendente, preservando o histórico da rejeição anterior.
   */
  async resubmitRequest(
    id: string,
    proposedData: Record<string, any>,
    actor: { id?: string; role?: UserRole },
  ) {
    const previous = await this.prisma.contentChangeRequest.findUnique({
      where: { id },
    });
    if (!previous) {
      throw new NotFoundException(`Solicitação ${id} não encontrada.`);
    }
    if (
      actor.role === UserRole.USER &&
      actor.id &&
      previous.requestedById !== actor.id
    ) {
      throw new ForbiddenException(
        'Você só pode reenviar suas próprias solicitações.',
      );
    }
    if (previous.status !== 'rejeitado') {
      throw new BadRequestException(
        'Apenas solicitações rejeitadas podem ser reenviadas.',
      );
    }

    const mergedData = {
      ...((previous.proposedData as Record<string, any>) || {}),
      ...proposedData,
    };

    return this.submitChangeRequest({
      entityType: previous.entityType,
      entityId: previous.entityId,
      requestType: previous.requestType,
      proposedData: mergedData,
      requestedById: actor.id || previous.requestedById,
    });
  }

  async cancelRequest(id: string, actor: { id?: string; role?: UserRole }) {
    const request = await this.prisma.contentChangeRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException(`Solicitação ${id} não encontrada.`);
    }
    if (
      actor.role === UserRole.USER &&
      actor.id &&
      request.requestedById !== actor.id
    ) {
      throw new ForbiddenException(
        'Você só pode cancelar suas próprias solicitações.',
      );
    }
    if (request.status !== 'pendente') {
      throw new BadRequestException(
        'Apenas solicitações pendentes podem ser canceladas.',
      );
    }

    return this.prisma.contentChangeRequest.update({
      where: { id },
      data: { status: 'cancelado' },
      include: APPROVAL_USER_INCLUDE,
    });
  }

  private async applyPageChange(
    requestType: RequestType,
    entityId: string | null,
    finalData: Record<string, any>,
    requestedById: string,
  ) {
    const data = this.pickFields(finalData, PAGE_SCALAR_FIELDS);
    this.normalizeNullableUuidFields(data, ['spaceId', 'organizationId']);

    let entity: any;
    if (requestType === 'delete') {
      entity = await this.prisma.page.update({
        where: { id: entityId! },
        data: { published: false, deletedAt: new Date() },
      });
    } else if (requestType === 'create' || !entityId) {
      entity = await this.prisma.page.create({
        data: {
          title: data.title,
          slug: data.slug,
          content: data.content ?? {},
          ...(data.description !== undefined && {
            description: data.description,
          }),
          published:
            data.published !== undefined ? Boolean(data.published) : true,
          spaceId: data.spaceId ?? null,
          organizationId: data.organizationId ?? null,
          userId: finalData.userId || requestedById,
        },
      });
    } else {
      entity = await this.prisma.page.update({
        where: { id: entityId },
        data: {
          ...data,
          published:
            data.published !== undefined ? Boolean(data.published) : true,
          deletedAt: null,
        },
      });
    }

    await this.cacheService?.invalidateByPrefix('cache:pages:public');
    return entity;
  }

  private async applyArticleChange(
    requestType: RequestType,
    entityId: string | null,
    finalData: Record<string, any>,
    requestedById: string,
  ) {
    if (requestType === 'delete') {
      return this.prisma.article.update({
        where: { id: entityId! },
        data: { status: 'excluido', deletedAt: new Date() },
      });
    }

    const categoryIds = Array.isArray(finalData.categoryIds)
      ? finalData.categoryIds
      : undefined;
    const data = this.pickFields(finalData, ARTICLE_SCALAR_FIELDS);
    this.normalizeNullableUuidFields(data, [
      'organizationId',
      'galleryId',
      'editorId',
    ]);

    const current = entityId
      ? await this.prisma.article.findUnique({ where: { id: entityId } })
      : null;

    const pubDate = data.publicationDate
      ? new Date(data.publicationDate)
      : (current?.publicationDate ?? null);
    const expDate =
      data.expirationDate !== undefined
        ? data.expirationDate
          ? new Date(data.expirationDate)
          : null
        : undefined;

    const resolvedStatus = this.resolveArticleStatus(
      data.status || 'publicado',
      pubDate,
    );

    if (requestType === 'create' || !entityId) {
      return this.prisma.article.create({
        data: {
          title: data.title,
          slug: data.slug,
          coverId: data.coverId,
          ...data,
          body: data.body ?? {},
          status: resolvedStatus,
          publicationDate:
            resolvedStatus === 'publicado' && !pubDate ? new Date() : pubDate,
          ...(expDate !== undefined && { expirationDate: expDate }),
          authorId: finalData.authorId || finalData.userId || requestedById,
          ...(categoryIds?.length
            ? { categories: { connect: categoryIds.map((id) => ({ id })) } }
            : {}),
        },
        include: { organization: true, categories: true },
      });
    }

    return this.prisma.article.update({
      where: { id: entityId },
      data: {
        ...data,
        status: resolvedStatus,
        publicationDate:
          resolvedStatus === 'publicado' && !pubDate ? new Date() : pubDate,
        ...(expDate !== undefined && { expirationDate: expDate }),
        deletedAt: null,
        ...(categoryIds
          ? { categories: { set: categoryIds.map((id) => ({ id })) } }
          : {}),
      },
      include: { organization: true, categories: true },
    });
  }

  private async applyPopupChange(
    requestType: RequestType,
    entityId: string | null,
    finalData: Record<string, any>,
    requestedById: string,
  ) {
    if (requestType === 'delete') {
      return this.prisma.popups.update({
        where: { id: entityId! },
        data: { active: false, status: 'excluido', deletedAt: new Date() },
      });
    }

    const data = this.pickFields(finalData, POPUP_SCALAR_FIELDS);
    this.normalizeNullableUuidFields(data, ['spaceId', 'organizationId']);
    if (data.publicationDate) {
      data.publicationDate = new Date(data.publicationDate);
    }
    if (data.expirationDate) {
      data.expirationDate = new Date(data.expirationDate);
    }

    if (requestType === 'create' || !entityId) {
      return this.prisma.popups.create({
        data: {
          title: data.title,
          imageId: data.imageId,
          userId: finalData.userId || requestedById,
          ...data,
          active: data.active !== undefined ? Boolean(data.active) : true,
          status: data.status || 'publicado',
        },
      });
    }

    return this.prisma.popups.update({
      where: { id: entityId },
      data: {
        ...data,
        active: data.active !== undefined ? Boolean(data.active) : true,
        status: data.status || 'publicado',
        deletedAt: null,
      },
    });
  }

  private async applyGalleryChange(
    requestType: RequestType,
    entityId: string | null,
    finalData: Record<string, any>,
    requestedById: string,
  ) {
    if (requestType === 'delete') {
      return this.prisma.galleries.update({
        where: { id: entityId! },
        data: { active: false, deletedAt: new Date() },
      });
    }

    const slides = Array.isArray(finalData.slides) ? finalData.slides : null;
    const data = this.pickFields(finalData, GALLERY_SCALAR_FIELDS);
    this.normalizeNullableUuidFields(data, ['spaceId', 'organizationId']);

    if (requestType === 'create' || !entityId) {
      return this.prisma.galleries.create({
        data: {
          title: data.title,
          ...data,
          active: data.active !== undefined ? Boolean(data.active) : true,
          userId: finalData.userId || requestedById,
          slides: slides
            ? {
                create: slides.map((slide: any) => ({
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

    if (slides) {
      const executeSlideReplacement = async (tx: any) => {
        await tx.galleryMedia.deleteMany({ where: { galleryId: entityId } });
        return tx.galleries.update({
          where: { id: entityId },
          data: {
            ...data,
            active: data.active !== undefined ? Boolean(data.active) : true,
            deletedAt: null,
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
      };

      if (typeof this.prisma.$transaction === 'function') {
        return this.prisma.$transaction((tx) => executeSlideReplacement(tx));
      }
      return executeSlideReplacement(this.prisma);
    }

    return this.prisma.galleries.update({
      where: { id: entityId },
      data: {
        ...data,
        active: data.active !== undefined ? Boolean(data.active) : true,
        deletedAt: null,
      },
    });
  }

  private async applyServiceChange(
    requestType: RequestType,
    entityId: string | null,
    finalData: Record<string, any>,
    requestedById: string,
  ) {
    if (requestType === 'delete') {
      return this.prisma.services.update({
        where: { id: entityId! },
        data: { active: false, deletedAt: new Date() },
      });
    }

    const data = this.pickFields(finalData, SERVICE_SCALAR_FIELDS);
    this.normalizeNullableUuidFields(data, ['organizationId']);

    if (requestType === 'create' || !entityId) {
      return this.prisma.services.create({
        data: {
          title: data.title,
          link: data.link,
          imageId: data.imageId,
          ...data,
          active: data.active !== undefined ? Boolean(data.active) : true,
          userId: finalData.userId || requestedById,
        },
      });
    }

    return this.prisma.services.update({
      where: { id: entityId },
      data: {
        ...data,
        active: data.active !== undefined ? Boolean(data.active) : true,
        deletedAt: null,
      },
    });
  }

  private async applyStructuralDelete(entityType: string, entityId: string) {
    switch (entityType) {
      case 'Menu': {
        const res = await this.prisma.menu.update({
          where: { id: entityId },
          data: { active: false },
        });
        await this.cacheService?.invalidateByPrefix('cache:menus');
        return res;
      }
      case 'MenuItem': {
        const res = await this.prisma.menuItem.update({
          where: { id: entityId },
          data: { visible: false },
        });
        await this.cacheService?.invalidateByPrefix('cache:menus');
        return res;
      }
      case 'Organization':
        return this.prisma.organization.update({
          where: { id: entityId },
          data: { active: false },
        });
      case 'Story':
        return this.prisma.storiesItem.updateMany({
          where: { storyId: entityId },
          data: { expirationDate: new Date() },
        });
      default:
        throw new BadRequestException(
          `Tipo de entidade não suportado no fluxo de aprovação: ${entityType}`,
        );
    }
  }

  /**
   * Aprova uma solicitação pendente (com opção de editar o `proposedData` antes de publicar).
   */
  async approveRequest(
    requestId: string,
    reviewerId?: string,
    overrideProposedData?: Record<string, any>,
  ) {
    const request = await this.prisma.contentChangeRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException(`Solicitação ${requestId} não encontrada.`);
    }
    if (request.status !== 'pendente') {
      throw new BadRequestException('Esta solicitação já foi processada.');
    }

    const baseData = (request.proposedData as Record<string, any>) || {};
    const finalData = overrideProposedData
      ? { ...baseData, ...overrideProposedData }
      : { ...baseData };
    const normalizedType = this.normalizeEntityType(request.entityType);

    let appliedEntity: any;
    switch (normalizedType) {
      case 'Page':
        appliedEntity = await this.applyPageChange(
          request.requestType,
          request.entityId,
          finalData,
          request.requestedById,
        );
        break;
      case 'Article':
        appliedEntity = await this.applyArticleChange(
          request.requestType,
          request.entityId,
          finalData,
          request.requestedById,
        );
        break;
      case 'Popup':
        appliedEntity = await this.applyPopupChange(
          request.requestType,
          request.entityId,
          finalData,
          request.requestedById,
        );
        break;
      case 'Gallery':
        appliedEntity = await this.applyGalleryChange(
          request.requestType,
          request.entityId,
          finalData,
          request.requestedById,
        );
        break;
      case 'Service':
        appliedEntity = await this.applyServiceChange(
          request.requestType,
          request.entityId,
          finalData,
          request.requestedById,
        );
        break;
      default:
        if (request.requestType === 'delete' && request.entityId) {
          appliedEntity = await this.applyStructuralDelete(
            normalizedType,
            request.entityId,
          );
        } else {
          throw new BadRequestException(
            `Tipo de entidade não suportado no fluxo de aprovação: ${normalizedType}`,
          );
        }
    }

    const updatedRequest = await this.prisma.contentChangeRequest.update({
      where: { id: request.id },
      data: {
        status: 'aprovado',
        entityId: appliedEntity?.id ?? request.entityId,
        proposedData: finalData,
        appliedData: finalData,
        reviewedById: reviewerId ?? null,
        reviewedAt: new Date(),
      },
      include: APPROVAL_USER_INCLUDE,
    });

    return {
      request: updatedRequest,
      entity: appliedEntity,
    };
  }

  /**
   * Rejeita uma solicitação pendente preservando `proposedData` para histórico e correção do autor.
   */
  async rejectRequest(
    requestId: string,
    reviewerId?: string,
    rejectionReason?: string,
  ) {
    const request = await this.prisma.contentChangeRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException(`Solicitação ${requestId} não encontrada.`);
    }
    if (request.status !== 'pendente') {
      throw new BadRequestException('Esta solicitação já foi processada.');
    }

    return this.prisma.contentChangeRequest.update({
      where: { id: request.id },
      data: {
        status: 'rejeitado',
        rejectionReason:
          rejectionReason?.trim() || 'Solicitação rejeitada pela revisão.',
        reviewedById: reviewerId ?? null,
        reviewedAt: new Date(),
      },
      include: APPROVAL_USER_INCLUDE,
    });
  }

  async approveByEntityOrRequestId(
    entityType: string,
    idOrRequestId: string,
    reviewerId?: string,
    overrideProposedData?: Record<string, any>,
  ) {
    const normalizedType = this.normalizeEntityType(entityType);
    const pending = await this.prisma.contentChangeRequest.findFirst({
      where: {
        status: 'pendente',
        OR: [
          { id: idOrRequestId },
          { entityType: normalizedType, entityId: idOrRequestId },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!pending) {
      throw new NotFoundException(
        'Nenhuma solicitação pendente encontrada para aprovação.',
      );
    }

    const result = await this.approveRequest(
      pending.id,
      reviewerId,
      overrideProposedData,
    );
    return result.entity;
  }

  async rejectByEntityOrRequestId(
    entityType: string,
    idOrRequestId: string,
    reviewerId?: string,
    rejectionReason?: string,
  ) {
    const normalizedType = this.normalizeEntityType(entityType);
    const pending = await this.prisma.contentChangeRequest.findFirst({
      where: {
        status: 'pendente',
        OR: [
          { id: idOrRequestId },
          { entityType: normalizedType, entityId: idOrRequestId },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!pending) {
      throw new NotFoundException(
        'Nenhuma solicitação pendente encontrada para rejeição.',
      );
    }

    const rejected = await this.rejectRequest(
      pending.id,
      reviewerId,
      rejectionReason,
    );
    const currentEntity = await this.fetchCurrentEntity(
      normalizedType,
      pending.entityId,
    );

    if (currentEntity) {
      return {
        ...currentEntity,
        workflowStatus: 'rejeitado',
        pendingRequest: null,
        lastRejectedRequest: rejected,
      };
    }
    return rejected;
  }
}
