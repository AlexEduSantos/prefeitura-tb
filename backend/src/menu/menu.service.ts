import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { MenuWhereInput } from '../generated/prisma/models';

@Injectable()
export class MenusService {
  constructor(private prisma: PrismaService) {}

  async create(createMenuDto: CreateMenuDto) {
    return this.prisma.menu.create({
      data: createMenuDto,
    });
  }

  async findAll() {
    return this.prisma.menu.findMany({
      include: {
        space: true,
        organization: true,
        items: {
          include: {
            page: true,
            category: true,
            parent: true,
            children: true,
            menu: true,
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.menu.findUnique({
      where: { id },
      include: {
        space: true,
        organization: true,
        items: {
          include: {
            page: true,
            category: true,
            parent: true,
            children: true,
            menu: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async findBy(field: string, value: string) {
    return this.prisma.menu.findMany({
      where: {
        [field]: value,
      } as MenuWhereInput,
      include: {
        space: true,
        organization: true,
        items: {
          include: {
            page: true,
            category: true,
            parent: true,
            children: true,
            menu: true,
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, updateMenuDto: CreateMenuDto) {
    return this.prisma.menu.update({
      where: { id },
      data: updateMenuDto,
    });
  }

  async remove(id: string) {
    return this.prisma.menu.delete({
      where: { id },
    });
  }
}
