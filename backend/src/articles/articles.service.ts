import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Article, Prisma } from '../generated/prisma/client';
import { UserRole } from '../generated/prisma/enums';
import { PaginationInput, resolvePagination } from '../common/utils/pagination';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Determina o status correto com base na data de publicação:
   * - Se o status for 'publicado' ou 'programado':
   *   - Se publicationDate for no futuro -> 'programado'
   *   - Se publicationDate for agora ou passado -> 'publicado'
   */
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

  async create(
    createArticleDto: CreateArticleDto,
    userRole?: UserRole,
  ): Promise<Article> {
    const { categoryIds, ...rest } = createArticleDto;

    const pubDate = createArticleDto.publicationDate
      ? new Date(createArticleDto.publicationDate)
      : null;
    const expDate = createArticleDto.expirationDate
      ? new Date(createArticleDto.expirationDate)
      : null;

    const isCollaborator = userRole === UserRole.USER;
    const resolvedStatus = isCollaborator
      ? 'rascunho'
      : this.resolveArticleStatus(createArticleDto.status, pubDate);
    const workflowStatus = isCollaborator
      ? 'pendente_aprovacao'
      : resolvedStatus === 'publicado' || resolvedStatus === 'programado'
        ? 'aprovado'
        : 'rascunho';

    return this.prisma.article.create({
      data: {
        ...rest,
        status: resolvedStatus,
        workflowStatus,
        publicationDate:
          resolvedStatus === 'publicado' && !pubDate ? new Date() : pubDate,
        expirationDate: expDate,
        categories: categoryIds?.length
          ? {
              connect: categoryIds.map((id) => ({ id })),
            }
          : undefined,
      },
    });
  }

  /**
   * Busca Full-Text Search (tsvector em português) sobre título, subtítulo e corpo do artigo.
   */
  async searchByFullText(term: string): Promise<string[]> {
    const cleanTerm = term.trim();
    if (!cleanTerm || typeof (this.prisma as any).$queryRaw !== 'function') {
      return [];
    }

    try {
      const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM "article"
        WHERE to_tsvector(
          'portuguese',
          coalesce(title, '') || ' ' || coalesce(headline, '') || ' ' || coalesce(body::text, '')
        ) @@ plainto_tsquery('portuguese', ${cleanTerm})
        ORDER BY ts_rank(
          to_tsvector(
            'portuguese',
            coalesce(title, '') || ' ' || coalesce(headline, '') || ' ' || coalesce(body::text, '')
          ),
          plainto_tsquery('portuguese', ${cleanTerm})
        ) DESC
        LIMIT 100
      `;
      return Array.isArray(rows) ? rows.map((r) => r.id) : [];
    } catch {
      return [];
    }
  }

  /**
   * Listagem PÚBLICA:
   * Retorna APENAS artigos com status 'publicado',
   * cuja data de publicação já foi atingida e que ainda não expiraram.
   */
  async findAll(
    search?: string,
    categorySlug?: string,
    organizationId?: string,
    type?: string,
    authorId?: string,
    startDate?: string,
    endDate?: string,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    const now = new Date();
    const isUuid = (val: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        val,
      );

    const dateFilter: any = {};
    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) {
        start.setHours(0, 0, 0, 0);
        dateFilter.gte = start;
      }
    }
    if (endDate) {
      const end = new Date(endDate);
      if (!isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
    }

    const trimmedSearch = search?.trim();
    const ftsIds = trimmedSearch
      ? await this.searchByFullText(trimmedSearch)
      : [];

    let orderByClause: any = { createdAt: 'desc' };
    if (sortBy === 'title') {
      orderByClause = { title: sortOrder };
    } else if (sortBy === 'date') {
      orderByClause = [
        { publicationDate: sortOrder },
        { createdAt: sortOrder },
      ];
    } else if (trimmedSearch) {
      orderByClause = {
        _relevance: {
          fields: ['title'],
          search: trimmedSearch,
          sort: 'desc',
        },
      };
    }

    const articles = await this.prisma.article.findMany({
      include: {
        organization: true,
        categories: true,
        cover: true,
        author: {
          select: { id: true, name: true, avatar: true },
        },
        editor: {
          select: { id: true, name: true, avatar: true },
        },
        gallery: {
          include: {
            slides: {
              orderBy: { order: 'asc' },
              include: {
                media: true,
              },
            },
          },
        },
      },
      where: {
        status: 'publicado',
        deletedAt: null,
        OR: [{ publicationDate: null }, { publicationDate: { lte: now } }],
        AND: [
          {
            OR: [{ expirationDate: null }, { expirationDate: { gt: now } }],
          },
          ...(Object.keys(dateFilter).length > 0
            ? [
                {
                  OR: [
                    { publicationDate: dateFilter },
                    {
                      AND: [
                        { publicationDate: null },
                        { createdAt: dateFilter },
                      ],
                    },
                  ],
                },
              ]
            : []),
          ...(trimmedSearch
            ? [
                {
                  OR: [
                    {
                      title: {
                        contains: trimmedSearch,
                        mode: 'insensitive' as const,
                      },
                    },
                    {
                      headline: {
                        contains: trimmedSearch,
                        mode: 'insensitive' as const,
                      },
                    },
                    ...(ftsIds.length > 0 ? [{ id: { in: ftsIds } }] : []),
                  ],
                },
              ]
            : []),
        ],
        ...(categorySlug
          ? {
              categories: {
                some: isUuid(categorySlug)
                  ? { OR: [{ id: categorySlug }, { slug: categorySlug }] }
                  : { slug: categorySlug },
              },
            }
          : {}),
        ...(organizationId ? { organizationId } : {}),
        ...(type ? { type } : {}),
        ...(authorId && isUuid(authorId) ? { authorId } : {}),
      },
      orderBy: orderByClause,
    });

    return articles;
  }

  /**
   * Listagem ADMINISTRATIVA (Dashboard):
   * Retorna todos os artigos exceto os 'excluido' (soft-deleted),
   * a menos que um status específico (incluindo 'excluido') seja requisitado.
   */
  async findAllAdmin(
    search?: string,
    status?: string,
    categorySlug?: string,
    organizationId?: string,
    pagination?: PaginationInput,
  ) {
    const statusWhere: any = status ? status : { not: 'excluido' };
    const { skip, take } = resolvePagination(pagination);
    const trimmedSearch = search?.trim();
    const ftsIds = trimmedSearch
      ? await this.searchByFullText(trimmedSearch)
      : [];

    const articles = await this.prisma.article.findMany({
      include: {
        organization: true,
        categories: true,
        cover: true,
        author: true,
        editor: true,
        gallery: {
          include: {
            slides: {
              orderBy: { order: 'asc' },
              include: {
                media: true,
              },
            },
          },
        },
      },
      where: {
        status: statusWhere,
        ...(trimmedSearch
          ? {
              OR: [
                {
                  title: {
                    contains: trimmedSearch,
                    mode: 'insensitive',
                  },
                },
                {
                  headline: {
                    contains: trimmedSearch,
                    mode: 'insensitive',
                  },
                },
                ...(ftsIds.length > 0 ? [{ id: { in: ftsIds } }] : []),
              ],
            }
          : {}),
        ...(categorySlug
          ? {
              categories: {
                some: {
                  slug: categorySlug,
                },
              },
            }
          : {}),
        ...(organizationId ? { organizationId } : {}),
      },
      skip,
      take,
      orderBy: trimmedSearch
        ? {
            _relevance: {
              fields: ['title'],
              search: trimmedSearch,
              sort: 'desc',
            },
          }
        : { createdAt: 'desc' },
    });

    return articles;
  }

  /**
   * Visualização PÚBLICA por slug:
   * Apenas artigos publicados e não expirados são acessíveis publicamente.
   */
  async findOne(slug: string) {
    const now = new Date();

    const article = await this.prisma.article.findFirst({
      where: {
        slug,
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
        categories: true,
        cover: true,
        author: {
          select: { id: true, name: true, avatar: true },
        },
        editor: {
          select: { id: true, name: true, avatar: true },
        },
        gallery: {
          include: {
            slides: {
              orderBy: { order: 'asc' },
              include: {
                media: true,
              },
            },
          },
        },
      },
    });

    if (!article) {
      throw new NotFoundException(
        `Artigo com caminho ${slug} não encontrado ou indisponível publicamente.`,
      );
    }

    return article;
  }

  /**
   * Visualização/Edição ADMINISTRATIVA por ID:
   * Sem restrição de status (permite editar rascunho, programado, etc.).
   */
  async findOneById(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        organization: true,
        categories: true,
        cover: true,
        author: true,
        editor: true,
        gallery: {
          include: {
            slides: {
              orderBy: { order: 'asc' },
              include: {
                media: true,
              },
            },
          },
        },
      },
    });

    if (!article) {
      throw new NotFoundException(`Artigo com id ${id} não encontrado.`);
    }

    return article;
  }

  async update(
    id: string,
    updateArticleDto: UpdateArticleDto,
    userRole?: UserRole,
  ): Promise<Article> {
    const {
      categoryIds,
      authorId: _authorId,
      author: _author,
      ...rest
    } = updateArticleDto as any;
    const formattedData: any = { ...rest };

    const currentArticle = await this.findOneById(id);

    const pubDate =
      updateArticleDto.publicationDate !== undefined
        ? updateArticleDto.publicationDate
          ? new Date(updateArticleDto.publicationDate)
          : null
        : currentArticle.publicationDate;

    if (updateArticleDto.publicationDate !== undefined) {
      formattedData.publicationDate = pubDate;
    }

    if (updateArticleDto.expirationDate !== undefined) {
      formattedData.expirationDate = updateArticleDto.expirationDate
        ? new Date(updateArticleDto.expirationDate)
        : null;
    }

    if (updateArticleDto.status !== undefined) {
      formattedData.status = this.resolveArticleStatus(
        updateArticleDto.status,
        pubDate,
      );
      if (formattedData.status === 'publicado' && !pubDate) {
        formattedData.publicationDate = new Date();
      }
    } else if (updateArticleDto.publicationDate !== undefined) {
      // Se mudou a data de publicação de um artigo que já estava publicado/programado
      if (
        currentArticle.status === 'publicado' ||
        currentArticle.status === 'programado'
      ) {
        formattedData.status = this.resolveArticleStatus(
          currentArticle.status,
          pubDate,
        );
      }
    }

    if (userRole === UserRole.USER) {
      if (currentArticle.status === 'publicado') {
        const pendingData = {
          ...formattedData,
          ...(categoryIds ? { categoryIds } : {}),
        };
        return this.prisma.article.update({
          where: { id },
          data: {
            workflowStatus: 'pendente_aprovacao',
            pendingAction: {
              type: 'update',
              data: pendingData,
              requestedAt: new Date().toISOString(),
            },
          },
          include: {
            organization: true,
            categories: true,
          },
        });
      }

      formattedData.status = 'rascunho';
      formattedData.workflowStatus = 'pendente_aprovacao';
    } else {
      formattedData.pendingAction = Prisma.DbNull;
      if (
        formattedData.status === 'publicado' ||
        formattedData.status === 'programado'
      ) {
        formattedData.workflowStatus = 'aprovado';
      }
    }

    if (categoryIds) {
      formattedData.categories = {
        set: categoryIds.map((cid) => ({ id: cid })),
      };
    }

    return this.prisma.article.update({
      where: { id },
      data: formattedData,
      include: {
        organization: true,
        categories: true,
      },
    });
  }

  /**
   * Soft Delete (padrão e obrigatório para MANAGER) ou solicitação de exclusão para USER.
   */
  async remove(
    id: string,
    userRole?: UserRole,
    hardDelete = false,
  ): Promise<Article> {
    await this.findOneById(id);

    if (userRole === UserRole.USER) {
      return this.prisma.article.update({
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
      return this.prisma.article.delete({ where: { id } });
    }

    return this.prisma.article.update({
      where: { id },
      data: {
        status: 'excluido',
        deletedAt: new Date(),
        workflowStatus: 'excluido',
        pendingAction: Prisma.DbNull,
        updatedAt: new Date(),
      },
    });
  }

  async approve(id: string, approverId?: string): Promise<Article> {
    const current = await this.findOneById(id);
    const pending = current.pendingAction as {
      type?: string;
      data?: Record<string, any>;
    } | null;

    if (pending?.type === 'delete') {
      return this.prisma.article.update({
        where: { id },
        data: {
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
      const { categoryIds, ...restData } = pending.data;
      const pubDate = restData.publicationDate
        ? new Date(restData.publicationDate)
        : current.publicationDate;
      const resolvedStatus = this.resolveArticleStatus(
        restData.status || 'publicado',
        pubDate,
      );

      return this.prisma.article.update({
        where: { id },
        data: {
          ...restData,
          status: resolvedStatus,
          publicationDate:
            resolvedStatus === 'publicado' && !pubDate ? new Date() : pubDate,
          deletedAt: null,
          workflowStatus: 'aprovado',
          pendingAction: Prisma.DbNull,
          approvedById: approverId ?? null,
          approvedAt: new Date(),
          ...(Array.isArray(categoryIds)
            ? {
                categories: {
                  set: categoryIds.map((cid: string) => ({ id: cid })),
                },
              }
            : {}),
        },
        include: {
          organization: true,
          categories: true,
        },
      });
    }

    const pubDate = current.publicationDate;
    const resolvedStatus =
      current.status === 'programado' && pubDate && pubDate > new Date()
        ? 'programado'
        : 'publicado';

    return this.prisma.article.update({
      where: { id },
      data: {
        status: resolvedStatus,
        publicationDate: pubDate ?? new Date(),
        deletedAt: null,
        workflowStatus: 'aprovado',
        pendingAction: Prisma.DbNull,
        approvedById: approverId ?? null,
        approvedAt: new Date(),
      },
      include: {
        organization: true,
        categories: true,
      },
    });
  }

  async reject(id: string, approverId?: string): Promise<Article> {
    await this.findOneById(id);
    return this.prisma.article.update({
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
