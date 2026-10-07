import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';

@Injectable()
export class SpacesService {
  constructor(private prisma: PrismaService) {}

  async create(createSpaceDto: CreateSpaceDto) {
    return this.prisma.space.create({
      data: createSpaceDto,
    });
  }

  async findAll() {
    return this.prisma.space.findMany({
      include: {
        organizations: true,
        _count: {
          select: {
            pages: true,
            galleries: true,
            popups: true,
          },
        },
      },
      orderBy: { title: 'asc' },
    });
  }

  async findOne(id: string) {
    const space = await this.prisma.space.findUnique({
      where: { id },
      include: {
        organizations: true,
        pages: true,
      },
    });
    if (!space) {
      throw new NotFoundException(`Espaço com ID ${id} não encontrado.`);
    }
    return space;
  }

  async findBySlug(slug: string) {
    const space = await this.prisma.space.findUnique({
      where: { slug },
      include: {
        organizations: true,
        pages: {
          where: { published: true },
        },
      },
    });
    if (!space) {
      throw new NotFoundException(`Espaço com slug "${slug}" não encontrado.`);
    }
    return space;
  }

  async update(id: string, updateSpaceDto: UpdateSpaceDto) {
    await this.findOne(id);
    return this.prisma.space.update({
      where: { id },
      data: updateSpaceDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.space.delete({
      where: { id },
    });
  }
}
