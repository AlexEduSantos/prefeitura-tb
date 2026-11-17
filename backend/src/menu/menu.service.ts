import { BadRequestException, Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { RedisCacheService } from '../common/cache/redis-cache.service';

interface MenuTreeItemInput {
  id: string;
  parentId?: string | null;
}

type MenuTreeNode<T extends MenuTreeItemInput> = T & {
  children: Array<MenuTreeNode<T>>;
};

export const ALLOWED_MENU_FILTER_FIELDS = [
  'id',
  'title',
  'location',
  'spaceId',
  'organizationId',
  'active',
] as const;

@Injectable()
export class MenusService {
  constructor(
    private prisma: PrismaService,
    @Optional() private readonly cacheService?: RedisCacheService,
  ) {}

  async create(createMenuDto: CreateMenuDto) {
    const created = await this.prisma.menu.create({
      data: createMenuDto,
    });
    await this.cacheService?.invalidateByPrefix('cache:menus');
    return created;
  }

  async findAll() {
    const fetchMenus = async () => {
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
    };

    return this.cacheService
      ? this.cacheService.getOrSet('cache:menus:all', fetchMenus)
      : fetchMenus();
  }

  /**
   * Monta a árvore de itens a partir de uma lista flat.
   * - Itens com `parentId` referenciando outro item da lista viram filhos.
   * - Itens com `parentId` null (ou apontando para item inexistente) viram raízes.
   * - A ordem é preservada conforme vieram do banco.
   */
  private buildTree<T extends MenuTreeItemInput>(
    items: T[],
  ): Array<MenuTreeNode<T>> {
    const map = new Map<string, MenuTreeNode<T>>();
    const roots: Array<MenuTreeNode<T>> = [];

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
    const fetchMenu = async () => {
      const menu = await this.prisma.menu.findFirst({
        where: { id, active: true },
        include: {
          space: true,
          organization: true,
          items: {
            where: { visible: true },
            orderBy: [{ parentId: 'asc' }, { order: 'asc' }],
            include: {
              page: { include: { space: { select: { slug: true } } } },
              category: true,
            },
          },
        },
      });

      if (!menu) return null;

      return {
        ...menu,
        items: this.buildTree(menu.items),
      };
    };

    return this.cacheService
      ? this.cacheService.getOrSet(`cache:menus:one:${id}`, fetchMenu)
      : fetchMenu();
  }

  async findBy(field: string, value: string) {
    if (!ALLOWED_MENU_FILTER_FIELDS.includes(field as any)) {
      throw new BadRequestException(`Campo de filtro não permitido: ${field}`);
    }

    const filterValue = field === 'active' ? value === 'true' : value;

    const fetchMenus = async () => {
      const menus = await this.prisma.menu.findMany({
        where: {
          [field]: filterValue,
        },
        include: {
          space: true,
          organization: true,
          items: {
            where: { visible: true },
            orderBy: [{ parentId: 'asc' }, { order: 'asc' }],
            include: {
              page: { include: { space: { select: { slug: true } } } },
              category: true,
              parent: true,
              children: true,
              menu: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return menus.map((menu) => ({
        ...menu,
        items: this.buildTree(menu.items),
      }));
    };

    return this.cacheService
      ? this.cacheService.getOrSet(
          `cache:menus:by:${field}:${value}`,
          fetchMenus,
        )
      : fetchMenus();
  }

  async update(id: string, updateMenuDto: CreateMenuDto) {
    const updated = await this.prisma.menu.update({
      where: { id },
      data: updateMenuDto,
    });
    await this.cacheService?.invalidateByPrefix('cache:menus');
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.prisma.menu.delete({
      where: { id },
    });
    await this.cacheService?.invalidateByPrefix('cache:menus');
    return deleted;
  }
}
