import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfficialGazetteDto } from './dto/create-official-gazette.dto';
import { UpdateOfficialGazetteDto } from './dto/update-official-gazette.dto';
import { QueryOfficialGazetteDto } from './dto/query-official-gazette.dto';

@Injectable()
export class OfficialGazetteService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Criação de uma nova edição do Diário/Boletim Oficial.
   * Vincula automaticamente o usuário criador (ADMIN ou PUBLISHER).
   */
  async create(createDto: CreateOfficialGazetteDto, userId: string) {
    const publicationDate = new Date(createDto.publicationDate);

    return this.prisma.officialGazette.create({
      data: {
        title: createDto.title,
        edition: createDto.edition || null,
        description: createDto.description || null,
        publicationDate,
        fileUrl: createDto.fileUrl,
        fileSize: createDto.fileSize || null,
        pageCount: createDto.pageCount || null,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Atualização de uma edição existente.
   * Vincula o usuário editor (ADMIN ou PUBLISHER).
   */
  async update(id: string, updateDto: UpdateOfficialGazetteDto, userId: string) {
    await this.ensureExists(id);

    const data: any = {
      ...updateDto,
      updatedById: userId,
    };

    if (updateDto.publicationDate) {
      data.publicationDate = new Date(updateDto.publicationDate);
    }

    return this.prisma.officialGazette.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Exclusão permanente do registro da edição.
   */
  async remove(id: string) {
    await this.ensureExists(id);
    return this.prisma.officialGazette.delete({
      where: { id },
    });
  }

  async searchByFullText(term: string): Promise<string[]> {
    const cleanTerm = term.trim();
    if (!cleanTerm || typeof (this.prisma as any).$queryRaw !== 'function') {
      return [];
    }

    try {
      const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM "official_gazette"
        WHERE to_tsvector(
          'portuguese',
          coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(edition, '')
        ) @@ plainto_tsquery('portuguese', ${cleanTerm})
        ORDER BY ts_rank(
          to_tsvector(
            'portuguese',
            coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(edition, '')
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
   * Endpoint de Leitura Pública:
   * Retorna os boletins oficiais para o portal da transparência / site público,
   * ordenados do mais recente para o mais antigo por data de publicação.
   */
  async findAllPublic(query: QueryOfficialGazetteDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const ftsIds = query.search?.trim()
      ? await this.searchByFullText(query.search.trim())
      : [];
    const where = this.buildWhereClause(query, ftsIds);

    const [total, data] = await Promise.all([
      this.prisma.officialGazette.count({ where }),
      this.prisma.officialGazette.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ publicationDate: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          title: true,
          edition: true,
          description: true,
          publicationDate: true,
          fileUrl: true,
          fileSize: true,
          pageCount: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Endpoint de Leitura Administrativa:
   * Retorna os boletins com informações de auditoria (quem cadastrou e quem atualizou).
   */
  async findAllAdmin(query: QueryOfficialGazetteDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const ftsIds = query.search?.trim()
      ? await this.searchByFullText(query.search.trim())
      : [];
    const where = this.buildWhereClause(query, ftsIds);

    const [total, data] = await Promise.all([
      this.prisma.officialGazette.count({ where }),
      this.prisma.officialGazette.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ publicationDate: 'desc' }, { createdAt: 'desc' }],
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatar: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatar: true,
            },
          },
        },
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Busca um boletim por ID com informações completas.
   */
  async findOne(id: string) {
    const gazette = await this.prisma.officialGazette.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    if (!gazette) {
      throw new NotFoundException(`Boletim oficial com ID "${id}" não encontrado.`);
    }

    return gazette;
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.officialGazette.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException(`Boletim oficial com ID "${id}" não encontrado.`);
    }
    return exists;
  }

  private buildWhereClause(
    query: QueryOfficialGazetteDto,
    ftsIds: string[] = [],
  ) {
    const where: any = {};

    // Busca por termo no título, descrição ou edição (inclui Full-Text Search tsvector)
    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { edition: { contains: term, mode: 'insensitive' } },
        ...(ftsIds.length > 0 ? [{ id: { in: ftsIds } }] : []),
      ];
    }

    // Filtro por edição exata
    if (query.edition?.trim()) {
      where.edition = { contains: query.edition.trim(), mode: 'insensitive' };
    }

    // Filtro por ano e mês
    if (query.year) {
      const y = Number(query.year);
      if (query.month) {
        const m = Number(query.month) - 1; // 0-indexed no JS Date
        const startDate = new Date(Date.UTC(y, m, 1));
        const endDate = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
        where.publicationDate = {
          gte: startDate,
          lte: endDate,
        };
      } else {
        const startDate = new Date(Date.UTC(y, 0, 1));
        const endDate = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999));
        where.publicationDate = {
          gte: startDate,
          lte: endDate,
        };
      }
    } else if (query.startDate || query.endDate) {
      where.publicationDate = {};
      if (query.startDate) {
        where.publicationDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.publicationDate.lte = end;
      }
    }

    return where;
  }
}

