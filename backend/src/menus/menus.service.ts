import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { MenuItemDto } from './dto/menu-item.dto';

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMenuDto: CreateMenuDto) {
    // Check if the entity exists
    const entity = await this.prisma.entity.findUnique({
      where: { id: createMenuDto.entityId },
    });
    if (!entity) {
      throw new NotFoundException(
        `Secretaria com ID ${createMenuDto.entityId} não encontrada.`,
      );
    }

    return this.prisma.menu.create({
      data: createMenuDto,
    });
  }

  async findAll() {
    return this.prisma.menu.findMany({
      include: {
        items: {
          include: {
            page: {
              select: {
                slug: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  async findAllSubItems() {
    return this.prisma.menuItem.findMany({
      include: {
        page: {
          select: {
            slug: true,
          },
        },
        menu: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
    });
    if (!menu) {
      throw new NotFoundException(`Menu com ID ${id} não encontrado.`);
    }
    return menu;
  }

  async findByLocation(location: string, entityId: string) {
    const menu = await this.prisma.menu.findUnique({
      where: {
        entityId_location: {
          entityId,
          location,
        },
      },
      include: {
        items: {
          include: {
            page: {
              select: {
                slug: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!menu) {
      throw new NotFoundException(
        `Menu para a localização '${location}' e secretaria '${entityId}' não encontrado.`,
      );
    }

    // Build hierarchical tree
    const itemMap = new Map<string, any>();
    const rootItems: any[] = [];

    // Map all items first
    for (const item of menu.items) {
      itemMap.set(item.id, {
        id: item.id,
        label: item.label,
        order: item.order,
        url: item.url,
        parentId: item.parentId,
        pageId: item.pageId,
        pageSlug: item.page?.slug || null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        children: [],
      });
    }

    // Associate parent and children preserving database order
    for (const item of menu.items) {
      const mappedItem = itemMap.get(item.id);
      if (item.parentId) {
        const parent = itemMap.get(item.parentId);
        if (parent) {
          parent.children.push(mappedItem);
        } else {
          rootItems.push(mappedItem);
        }
      } else {
        rootItems.push(mappedItem);
      }
    }

    return {
      id: menu.id,
      name: menu.name,
      location: menu.location,
      entityId: menu.entityId,
      createdAt: menu.createdAt,
      updatedAt: menu.updatedAt,
      items: rootItems,
    };
  }

  async syncItems(menuId: string, items: MenuItemDto[]) {
    // Validate if the menu exists
    const menu = await this.findOne(menuId);

    return this.prisma.$transaction(async (tx) => {
      // Step 1: Delete all existing menu items of this menu.
      await tx.menuItem.deleteMany({
        where: { menuId },
      });

      if (!items || items.length === 0) {
        return [];
      }

      // Step 2: Keep track of temp ID to new DB ID mapping
      const clientIdToDbId = new Map<string, string>();
      const clientIds = new Set(items.filter((i) => i.id).map((i) => i.id!));

      let remaining = [...items];
      const createdItems: any[] = [];

      // Loop to insert items level by level
      while (remaining.length > 0) {
        const batch = remaining.filter((item) => {
          if (!item.parentId) return true;
          if (!clientIds.has(item.parentId)) return true;
          return clientIdToDbId.has(item.parentId);
        });

        if (batch.length === 0) {
          // Fallback: cycle or unresolved dependencies
          for (const item of remaining) {
            const created = await tx.menuItem.create({
              data: {
                label: item.label,
                order: item.order ?? 0,
                url: item.url || null,
                pageId: item.pageId || null,
                parentId: null,
                menuId,
              },
            });
            createdItems.push(created);
            if (item.id) {
              clientIdToDbId.set(item.id, created.id);
            }
          }
          break;
        }

        for (const item of batch) {
          const dbParentId = item.parentId
            ? clientIdToDbId.get(item.parentId)
            : null;
          const created = await tx.menuItem.create({
            data: {
              label: item.label,
              order: item.order ?? 0,
              url: item.url || null,
              pageId: item.pageId || null,
              parentId: dbParentId || null,
              menuId,
            },
          });
          createdItems.push(created);
          if (item.id) {
            clientIdToDbId.set(item.id, created.id);
          }
        }

        remaining = remaining.filter((item) => !batch.includes(item));
      }

      return createdItems;
    });
  }
}
