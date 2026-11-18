import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../generated/prisma/enums';
import { PaginationInput, resolvePagination } from '../common/utils/pagination';
import { ApprovalService } from '../approval/approval.service';

@Injectable()
export class ArticlesService {
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
    userId?: string,
  ): Promise<any> {
    const { categoryIds, ...rest } = createArticleDto;

    if (userRole === UserRole.USER) {
      const requestedById = userId || createArticleDto.authorId;
      const req = await this.approval.submitChangeRequest({
        entityType: 'Article',
        entityId: null,
        requestType: 'create',
        proposedData: {
          ...createArticleDto,
          authorId: requestedById,
        },
        requestedById,
      });
      return {
        id: req.id,
        ...rest,
        status: 'rascunho',
        workflowStatus: 'pendente',
        changeRequestId: req.id,
        pendingRequest: req,
      };
    }

    const pubDate = createArticleDto.publicationDate
      ? new Date(createArticleDto.publicationDate)
      : null;
    const expDate = createArticleDto.expirationDate
      ? new Date(createArticleDto.expirationDate)
      : null;

    const resolvedStatus = this.resolveArticleStatus(
      createArticleDto.status,
      pubDate,
    );

    return this.prisma.article.create({
      data: {
        ...rest,
        status: resolvedStatus,
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

    return this.approval.attachWorkflowMeta('Article', articles);
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

    return this.approval.attachWorkflowMetaOne('Article', article);
  }

  async update(
    id: string,
    updateArticleDto: UpdateArticleDto,
    userRole?: UserRole,
    userId?: string,
  ): Promise<any> {
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
      const pendingData = {
        ...formattedData,
        ...(categoryIds ? { categoryIds } : {}),
      };
      const req = await this.approval.submitChangeRequest({
        entityType: 'Article',
        entityId: id,
        requestType: 'update',
        proposedData: pendingData,
        requestedById: userId || currentArticle.authorId,
      });
      return {
        ...currentArticle,
        workflowStatus: 'pendente',
        changeRequestId: req.id,
        pendingRequest: req,
      };
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
    userId?: string,
  ): Promise<any> {
    const current = await this.findOneById(id);

    if (userRole === UserRole.USER) {
      const req = await this.approval.submitChangeRequest({
        entityType: 'Article',
        entityId: id,
        requestType: 'delete',
        proposedData: { title: current.title, slug: current.slug },
        requestedById: userId || current.authorId,
      });
      return {
        ...current,
        workflowStatus: 'pendente',
        changeRequestId: req.id,
        pendingRequest: req,
      };
    }

    if (userRole === UserRole.ADMIN && hardDelete) {
      return this.prisma.article.delete({ where: { id } });
    }

    return this.prisma.article.update({
      where: { id },
      data: {
        status: 'excluido',
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async approve(
    id: string,
    approverId?: string,
    proposedData?: Record<string, any>,
  ): Promise<any> {
    return this.approval.approveByEntityOrRequestId(
      'Article',
      id,
      approverId,
      proposedData,
    );
  }

  async reject(id: string, approverId?: string, reason?: string): Promise<any> {
    return this.approval.rejectByEntityOrRequestId(
      'Article',
      id,
      approverId,
      reason,
    );
  }
}
