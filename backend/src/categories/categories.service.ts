import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: createCategoryDto,
        include: {
          parent: true,
        },
      });
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === 'P2002') {
        throw new ConflictException(
          'Já existe uma categoria com este apelido (slug).',
        );
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.category.findMany({
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            articles: true,
          },
        },
      },
      orderBy: { title: 'asc' },
    });
  }

  async findTree() {
    return this.prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: true,
            _count: { select: { articles: true } },
          },
        },
        _count: { select: { articles: true } },
      },
      orderBy: { title: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
      },
    });
    if (!category) {
      throw new NotFoundException(`Categoria com ID ${id} não encontrada.`);
    }
    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: true,
        articles: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            cover: true,
            organization: true,
          },
        },
      },
    });
    if (!category) {
      throw new NotFoundException(
        `Categoria com slug "${slug}" não encontrada.`,
      );
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id);
    if (updateCategoryDto.parentId && updateCategoryDto.parentId === id) {
      throw new BadRequestException(
        'Uma categoria não pode ser pai de si mesma.',
      );
    }
    try {
      return await this.prisma.category.update({
        where: { id },
        data: updateCategoryDto,
      });
    } catch (error: unknown) {
      if ((error as { code?: string })?.code === 'P2002') {
        throw new ConflictException(
          'Já existe uma categoria com este apelido (slug).',
        );
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.category.delete({
      where: { id },
    });
  }
}
