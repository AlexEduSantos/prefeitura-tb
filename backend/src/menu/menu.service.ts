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
    const menus = await this.prisma.menu.findMany({
      include: {
        space: true,
        organization: true,
        items: {
          where: { visible: true },
          orderBy: [{ parentId: 'asc' }, { order: 'asc' }],
          include: {
            page: {
              include: {
                space: { select: { slug: true } },
              },
            },
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return menus.map((menu) => ({
      ...menu,
      items: this.buildTree(menu.items),
    }));
  }

  /**
   * Monta a árvore de itens a partir de uma lista flat.
   * - Itens com `parentId` referenciando outro item da lista viram filhos.
   * - Itens com `parentId` null (ou apontando para item inexistente) viram raízes.
   * - A ordem é preservada conforme vieram do banco.
   */
  private buildTree(items: any[]): any[] {
    const map = new Map<string, any>();
    const roots: any[] = [];

    // 1ª passada: cria uma cópia de cada item com `children: []`
    for (const item of items) {
      map.set(item.id, { ...item, children: [] });
    }

    // 2ª passada: liga cada item ao seu pai (ou à raiz)
    for (const item of items) {
      const node = map.get(item.id)!;
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async findOne(id: string) {
    const menu = await this.prisma.menu.findUnique({
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

    return {
      ...menu,
      items: this.buildTree(menu!.items),
    };
  }

  async findBy(field: string, value: string) {
    const menus = await this.prisma.menu.findMany({
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

    return menus.map((menu) => ({
      ...menu,
      items: this.buildTree(menu.items),
    }));
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
