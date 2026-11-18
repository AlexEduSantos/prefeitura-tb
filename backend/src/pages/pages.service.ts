import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { Page } from '../generated/prisma/client';
import { UserRole } from '../generated/prisma/enums';
import { PaginationInput, resolvePagination } from '../common/utils/pagination';
import { RedisCacheService } from '../common/cache/redis-cache.service';
import { ApprovalService } from '../approval/approval.service';

@Injectable()
export class PagesService {
  constructor(
    private prisma: PrismaService,
    @Optional() private readonly cacheService?: RedisCacheService,
    @Optional() private approvalService?: ApprovalService,
  ) {}

  private get approval(): ApprovalService {
    if (!this.approvalService) {
      this.approvalService = new ApprovalService(
        this.prisma,
        this.cacheService,
      );
    }
    return this.approvalService;
  }

  async create(
    createPageDto: CreatePageDto,
    userId?: string,
    userRole?: UserRole,
  ): Promise<any> {
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

    if (userRole === UserRole.USER) {
      const req = await this.approval.submitChangeRequest({
        entityType: 'Page',
        entityId: null,
        requestType: 'create',
        proposedData: {
          title,
          slug,
          ...(description !== undefined && { description }),
          content,
          published: published ?? true,
          spaceId: spaceId || null,
          organizationId: organizationId || null,
          userId,
        },
        requestedById: userId,
      });

      return {
        id: req.id,
        title,
        slug,
        description: description ?? null,
        content,
        published: false,
        spaceId: spaceId || null,
        organizationId: organizationId || null,
        userId,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
        workflowStatus: 'pendente',
        changeRequestId: req.id,
        pendingRequest: req,
      };
    }

    const created = await this.prisma.page.create({
      data: {
        title,
        slug,
        ...(description !== undefined && { description }),
        content,
        published: published ?? false,
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

  async findAll(pagination?: PaginationInput): Promise<any[]> {
    const { skip, take } = resolvePagination(pagination);
    const pages = await this.prisma.page.findMany({
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
    return this.approval.attachWorkflowMeta('Page', pages);
  }

  async findOne(id: string): Promise<any> {
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
    return this.approval.attachWorkflowMetaOne('Page', page);
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
    userId?: string,
  ): Promise<any> {
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
      const req = await this.approval.submitChangeRequest({
        entityType: 'Page',
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
    userId?: string,
  ): Promise<any> {
    if (userRole === UserRole.USER) {
      const current = await this.findOne(id);
      const req = await this.approval.submitChangeRequest({
        entityType: 'Page',
        entityId: id,
        requestType: 'delete',
        proposedData: { title: current.title, slug: current.slug },
        requestedById: userId || current.userId,
      });
      return {
        ...current,
        workflowStatus: 'pendente',
        changeRequestId: req.id,
        pendingRequest: req,
      };
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
        },
      });
    }

    await this.cacheService?.invalidateByPrefix('cache:pages:public');
    return result;
  }

  async approve(
    id: string,
    approverId?: string,
    proposedData?: Record<string, any>,
  ): Promise<any> {
    return this.approval.approveByEntityOrRequestId(
      'Page',
      id,
      approverId,
      proposedData,
    );
  }

  async reject(id: string, approverId?: string, reason?: string): Promise<any> {
    return this.approval.rejectByEntityOrRequestId(
      'Page',
      id,
      approverId,
      reason,
    );
  }
}
