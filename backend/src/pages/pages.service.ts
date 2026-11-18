import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { Page, Prisma } from '../generated/prisma/client';
import { UserRole } from '../generated/prisma/enums';
import { PaginationInput, resolvePagination } from '../common/utils/pagination';
import { RedisCacheService } from '../common/cache/redis-cache.service';

@Injectable()
export class PagesService {
  constructor(
    private prisma: PrismaService,
    @Optional() private readonly cacheService?: RedisCacheService,
  ) {}

  async create(
    createPageDto: CreatePageDto,
    userId?: string,
    userRole?: UserRole,
  ): Promise<Page> {
    if (!userId) {
      throw new BadRequestException(
        'Usuário autenticado não encontrado para criar a página.',
      );
    }

    const {
      title,
      slug,
      description,
      content,
      published,
      spaceId,
      organizationId,
    } = createPageDto;

    const isCollaborator = userRole === UserRole.USER;
    const resolvedPublished = isCollaborator ? false : (published ?? false);
    const workflowStatus = isCollaborator
      ? 'pendente_aprovacao'
      : resolvedPublished
        ? 'aprovado'
        : 'rascunho';

    const created = await this.prisma.page.create({
      data: {
        title,
        slug,
        ...(description !== undefined && { description }),
        content,
        published: resolvedPublished,
        workflowStatus,
        ...(spaceId !== undefined && { spaceId: spaceId || null }),
        ...(organizationId !== undefined && {
          organizationId: organizationId || null,
        }),
        userId,
      },
    });
    await this.cacheService?.invalidateByPrefix('cache:pages:public');
    return created;
  }

  async findAll(pagination?: PaginationInput): Promise<Page[]> {
    const { skip, take } = resolvePagination(pagination);
    return this.prisma.page.findMany({
      where: { deletedAt: null },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        space: true,
        organization: true,
        user: {
          select: { name: true, username: true, avatar: true, email: true },
        },
      },
    });
  }

  async findOne(id: string): Promise<Page> {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: {
        space: true,
        organization: true,
        user: {
          select: { name: true, username: true, avatar: true, email: true },
        },
      },
    });
    if (!page) {
      throw new NotFoundException(`Página com ID ${id} não encontrada.`);
    }
    return page;
  }

  async findByRoute(spaceSlug: string | null, pageSlug: string): Promise<Page> {
    const cacheKey = `cache:pages:public:route:${spaceSlug ?? 'root'}:${pageSlug}`;

    const fetchPage = async () => {
      const space = spaceSlug
        ? await this.prisma.space.findUnique({ where: { slug: spaceSlug } })
        : null;

      if (spaceSlug && !space) {
        throw new NotFoundException(`Espaço "${spaceSlug}" não encontrado.`);
      }

      const page = await this.prisma.page.findFirst({
        where: {
          spaceId: space ? space.id : null,
          slug: pageSlug,
          published: true,
          deletedAt: null,
        },
        include: {
          space: true,
          organization: true,
        },
      });

      if (!page) {
        throw new NotFoundException(`Página "${pageSlug}" não encontrada.`);
      }

      return page;
    };

    return this.cacheService
      ? this.cacheService.getOrSet(cacheKey, fetchPage)
      : fetchPage();
  }

  async findPublicPages(search?: string) {
    const normalizedSearch = search?.trim() || '';
    const cacheKey = `cache:pages:public:list:${normalizedSearch}`;

    const fetchPublicPages = async () => {
      const where: any = {
        published: true,
        deletedAt: null,
      };

      if (normalizedSearch !== '') {
        where.OR = [
          { title: { contains: normalizedSearch, mode: 'insensitive' } },
          { slug: { contains: normalizedSearch, mode: 'insensitive' } },
        ];
      }

      return this.prisma.page.findMany({
        where,
        include: {
          space: true,
          organization: true,
          user: {
            select: { name: true, avatar: true },
          },
        },
      });
    };

    return this.cacheService
      ? this.cacheService.getOrSet(cacheKey, fetchPublicPages)
      : fetchPublicPages();
  }

  async update(
    id: string,
    updatePageDto: UpdatePageDto,
    userRole?: UserRole,
  ): Promise<Page> {
    const {
      title,
      slug,
      description,
      content,
      published,
      spaceId,
      organizationId,
    } = updatePageDto;

    const data: Record<string, any> = {};
    if (title !== undefined) data.title = title;
    if (slug !== undefined) data.slug = slug;
    if (description !== undefined) data.description = description;
    if (content !== undefined) data.content = content;
    if (published !== undefined) data.published = published;
    if (spaceId !== undefined) data.spaceId = spaceId || null;
    if (organizationId !== undefined) {
      data.organizationId = organizationId || null;
    }

    if (userRole === UserRole.USER) {
      const current = await this.findOne(id);
      if (current.published) {
        const pendingUpdate = await this.prisma.page.update({
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
        return pendingUpdate;
      }

      data.published = false;
      data.workflowStatus = 'pendente_aprovacao';
    } else {
      data.pendingAction = Prisma.DbNull;
      if (published !== undefined) {
        data.workflowStatus = published ? 'aprovado' : 'rascunho';
      }
    }

    const updated = await this.prisma.page.update({
      where: { id },
      data,
    });
    await this.cacheService?.invalidateByPrefix('cache:pages:public');
    return updated;
  }

  async remove(
    id: string,
    userRole?: UserRole,
    hardDelete = false,
  ): Promise<Page> {
    if (userRole === UserRole.USER) {
      await this.findOne(id);
      return this.prisma.page.update({
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

    let result: Page;
    if (userRole === UserRole.ADMIN && hardDelete) {
      result = await this.prisma.page.delete({ where: { id } });
    } else {
      result = await this.prisma.page.update({
        where: { id },
        data: {
          published: false,
          deletedAt: new Date(),
          workflowStatus: 'excluido',
          pendingAction: Prisma.DbNull,
        },
      });
    }

    await this.cacheService?.invalidateByPrefix('cache:pages:public');
    return result;
  }

  async approve(id: string, approverId?: string): Promise<Page> {
    const current = await this.findOne(id);
    const pending = current.pendingAction as {
      type?: string;
      data?: Record<string, any>;
    } | null;

    let result: Page;
    if (pending?.type === 'delete') {
      result = await this.prisma.page.update({
        where: { id },
        data: {
          published: false,
          deletedAt: new Date(),
          workflowStatus: 'excluido',
          pendingAction: Prisma.DbNull,
          approvedById: approverId ?? null,
          approvedAt: new Date(),
        },
      });
    } else if (pending?.type === 'update' && pending.data) {
      result = await this.prisma.page.update({
        where: { id },
        data: {
          ...pending.data,
          published:
            pending.data.published !== undefined
              ? Boolean(pending.data.published)
              : true,
          deletedAt: null,
          workflowStatus: 'aprovado',
          pendingAction: Prisma.DbNull,
          approvedById: approverId ?? null,
          approvedAt: new Date(),
        },
      });
    } else {
      result = await this.prisma.page.update({
        where: { id },
        data: {
          published: true,
          deletedAt: null,
          workflowStatus: 'aprovado',
          pendingAction: Prisma.DbNull,
          approvedById: approverId ?? null,
          approvedAt: new Date(),
        },
      });
    }

    await this.cacheService?.invalidateByPrefix('cache:pages:public');
    return result;
  }

  async reject(id: string, approverId?: string): Promise<Page> {
    await this.findOne(id);
    const result = await this.prisma.page.update({
      where: { id },
      data: {
        workflowStatus: 'rejeitado',
        pendingAction: Prisma.DbNull,
        approvedById: approverId ?? null,
        approvedAt: new Date(),
      },
    });
    await this.cacheService?.invalidateByPrefix('cache:pages:public');
    return result;
  }
}
