import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { Page } from '../generated/prisma/client';
import {
  PaginationInput,
  resolvePagination,
} from '../common/utils/pagination';
import { RedisCacheService } from '../common/cache/redis-cache.service';

@Injectable()
export class PagesService {
  constructor(
    private prisma: PrismaService,
    @Optional() private readonly cacheService?: RedisCacheService,
  ) {}

  async create(createPageDto: CreatePageDto, userId?: string): Promise<Page> {
    const finalUserId = userId || createPageDto.userId;
    if (!finalUserId) {
      throw new Error(
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

    const created = await this.prisma.page.create({
      data: {
        title,
        slug,
        ...(description !== undefined && { description }),
        content,
        ...(published !== undefined && { published }),
        ...(spaceId !== undefined && { spaceId: spaceId || null }),
        ...(organizationId !== undefined && {
          organizationId: organizationId || null,
        }),
        userId: finalUserId,
      },
    });
    await this.cacheService?.invalidateByPrefix('cache:pages:public');
    return created;
  }

  async findAll(pagination?: PaginationInput): Promise<Page[]> {
    const { skip, take } = resolvePagination(pagination);
    return this.prisma.page.findMany({
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

  async update(id: string, updatePageDto: UpdatePageDto): Promise<Page> {
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

    const updated = await this.prisma.page.update({
      where: { id },
      data,
    });
    await this.cacheService?.invalidateByPrefix('cache:pages:public');
    return updated;
  }

  async remove(id: string): Promise<Page> {
    const deleted = await this.prisma.page.delete({
      where: { id },
    });
    await this.cacheService?.invalidateByPrefix('cache:pages:public');
    return deleted;
  }
}
