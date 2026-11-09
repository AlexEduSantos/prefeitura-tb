import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Article } from '../generated/prisma/client';

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

  async create(createArticleDto: CreateArticleDto): Promise<Article> {
    const { categoryIds, ...rest } = createArticleDto;

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
   * Listagem PÚBLICA:
   * Retorna APENAS artigos com status 'publicado',
   * cuja data de publicação já foi atingida e que ainda não expiraram.
   */
  async findAll(
    search?: string,
    categorySlug?: string,
    organizationId?: string,
  ) {
    const now = new Date();

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
        status: 'publicado',
        OR: [
          { publicationDate: null },
          { publicationDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { expirationDate: null },
              { expirationDate: { gt: now } },
            ],
          },
        ],
        ...(search
          ? {
              title: {
                contains: search,
                mode: 'insensitive',
              },
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
      orderBy: search
        ? {
            _relevance: {
              fields: ['title'],
              search: search,
              sort: 'desc',
            },
          }
        : { createdAt: 'desc' },
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
  ) {
    const statusWhere: any = status
      ? status
      : { not: 'excluido' };

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
        ...(search
          ? {
              title: {
                contains: search,
                mode: 'insensitive',
              },
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
      orderBy: search
        ? {
            _relevance: {
              fields: ['title'],
              search: search,
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
        OR: [
          { publicationDate: null },
          { publicationDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { expirationDate: null },
              { expirationDate: { gt: now } },
            ],
          },
        ],
      },
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
  ): Promise<Article> {
    const { categoryIds, ...rest } = updateArticleDto;
    const formattedData: any = { ...rest };

    const currentArticle = await this.findOneById(id);

    const pubDate = updateArticleDto.publicationDate !== undefined
      ? (updateArticleDto.publicationDate ? new Date(updateArticleDto.publicationDate) : null)
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
   * Soft Delete:
   * Marca o artigo como 'excluido' e atualiza o 'updatedAt'.
   * O artigo será removido fisicamente após 90 dias pelo scheduler.
   */
  async remove(id: string): Promise<Article> {
    await this.findOneById(id);

    return this.prisma.article.update({
      where: { id },
      data: {
        status: 'excluido',
        updatedAt: new Date(),
      },
    });
  }
}
