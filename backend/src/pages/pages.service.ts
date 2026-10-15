import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { Page } from '../generated/prisma/client';

@Injectable()
export class PagesService {
  constructor(private prisma: PrismaService) {}

  async create(createPageDto: CreatePageDto, userId?: string): Promise<Page> {
    const finalUserId = userId || createPageDto.userId;
    if (!finalUserId) {
      throw new Error('Usuário autenticado não encontrado para criar a página.');
    }
    return this.prisma.page.create({
      data: {
        ...createPageDto,
        userId: finalUserId,
      },
    });
  }

  async findAll(): Promise<Page[]> {
    return this.prisma.page.findMany({
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
  }

  async update(id: string, updatePageDto: UpdatePageDto): Promise<Page> {
    return this.prisma.page.update({
      where: { id },
      data: updatePageDto,
    });
  }

  async remove(id: string): Promise<Page> {
    return this.prisma.page.delete({
      where: { id },
    });
  }
}
