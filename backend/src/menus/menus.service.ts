import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { Prisma } from '@prisma/client';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- MENU CRUD ----------

  async createMenu(createMenuDto: CreateMenuDto) {
    // Check if the entity exists
    const entity = await this.prisma.entity.findUnique({
      where: { id: createMenuDto.entityId },
    });
    if (!entity) {
      throw new NotFoundException(
        `Secretaria com ID ${createMenuDto.entityId} não encontrada.`,
      );
    }

    const { items, ...menuData } = createMenuDto;

    return this.prisma.menu.create({
      data: {
        ...menuData,
        items: items?.length ? { create: items } : undefined,
      },
    });
  }

  async findAllMenus(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    location?: string;
    entityId?: string;
    name?: string;
  }) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'asc',
      location,
      entityId,
      name,
    } = params;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.MenuWhereInput = {};
    if (location) where.location = location;
    if (entityId) where.entityId = entityId;
    if (name) where.name = { contains: name, mode: 'insensitive' };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.menu.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          items: {
            include: { page: { select: { slug: true } } },
            orderBy: { order: 'asc' },
          },
        },
      }),
      this.prisma.menu.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneMenu(id: string) {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
      include: {
        items: {
          include: { page: { select: { slug: true } } },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!menu) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }
    return menu;
  }

  async updateMenu(id: string, updateMenuDto: UpdateMenuDto) {
    await this.findOneMenu(id); // ensure exists

    const { items, ...menuData } = updateMenuDto;

    console.log(items, menuData);

    const data: Prisma.MenuUncheckedUpdateInput = { ...menuData };
    if (items && items.length > 0) {
      data.items = { create: items };
    }
    return this.prisma.menu.update({
      where: { id },
      data,
    });
  }

  async deleteMenu(id: string) {
    await this.findOneMenu(id);
    return this.prisma.menu.delete({ where: { id } });
  }

  // ---------- MENU ITEM CRUD ----------

  async createMenuItem(menuId: string, createMenuItemDto: CreateMenuItemDto) {
    // Ensure menu exists
    await this.findOneMenu(menuId);

    // If parentId is provided, ensure parent exists and belongs to same menu
    if (createMenuItemDto.parentId) {
      const parent = await this.prisma.menuItem.findUnique({
        where: { id: createMenuItemDto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent item with ID ${createMenuItemDto.parentId} not found`,
        );
      }
      if (parent.menuId !== menuId) {
        throw new BadRequestException(
          'Parent item must belong to the same menu',
        );
      }
    }

    // If pageId is provided, ensure page exists (optional)
    if (createMenuItemDto.pageId) {
      const page = await this.prisma.page.findUnique({
        where: { id: createMenuItemDto.pageId },
      });
      if (!page) {
        throw new NotFoundException(
          `Page with ID ${createMenuItemDto.pageId} not found`,
        );
      }
    }

    return this.prisma.menuItem.create({
      data: {
        ...createMenuItemDto,
        menuId,
      },
      include: {
        page: { select: { slug: true } },
      },
    });
  }

  async findAllMenuItems() {
    return await this.prisma.menuItem.findMany({
      include: {
        page: { select: { slug: true } },
        menu: { select: { name: true, id: true } },
      },
      orderBy: { order: 'asc' },
    });
  }

  async findAllMenuItemsByMenuId(
    menuId: string,
    params: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      label?: string;
      parentId?: string;
    },
  ) {
    // Ensure menu exists
    await this.findOneMenu(menuId);

    const {
      page = 1,
      limit = 10,
      sortBy = 'order',
      sortOrder = 'asc',
      label,
      parentId,
    } = params;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.MenuItemWhereInput = { menuId };
    if (label) where.label = { contains: label, mode: 'insensitive' };
    if (parentId !== undefined) {
      where.parentId = parentId === 'null' ? null : parentId;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.menuItem.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          page: { select: { slug: true } },
          menu: { select: { name: true } },
        },
      }),
      this.prisma.menuItem.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneMenuItem(menuId: string, itemId: string) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id: itemId },
      include: {
        page: { select: { slug: true } },
        menu: { select: { name: true } },
      },
    });
    if (!item) {
      throw new NotFoundException(`MenuItem with ID ${itemId} not found`);
    }
    if (item.menuId !== menuId) {
      throw new BadRequestException(
        `MenuItem does not belong to menu ${menuId}`,
      );
    }
    return item;
  }

  async updateMenuItem(
    menuId: string,
    itemId: string,
    updateMenuItemDto: UpdateMenuItemDto,
  ) {
    // Ensure item exists and belongs to menu
    await this.findOneMenuItem(menuId, itemId);

    // Validate parent if provided
    if (updateMenuItemDto.parentId) {
      const parent = await this.prisma.menuItem.findUnique({
        where: { id: updateMenuItemDto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent item with ID ${updateMenuItemDto.parentId} not found`,
        );
      }
      if (parent.menuId !== menuId) {
        throw new BadRequestException(
          'Parent item must belong to the same menu',
        );
      }
      // Prevent self-parenting
      if (parent.id === itemId) {
        throw new BadRequestException('Cannot set parent to itself');
      }
    }

    if (updateMenuItemDto.pageId) {
      const page = await this.prisma.page.findUnique({
        where: { id: updateMenuItemDto.pageId },
      });
      if (!page) {
        throw new NotFoundException(
          `Page with ID ${updateMenuItemDto.pageId} not found`,
        );
      }
    }

    return this.prisma.menuItem.update({
      where: { id: itemId },
      data: updateMenuItemDto,
      include: {
        page: { select: { slug: true } },
      },
    });
  }

  async deleteMenuItem(menuId: string, itemId: string) {
    await this.findOneMenuItem(menuId, itemId);
    // Optionally, also delete children? Or handle in business logic.
    return this.prisma.menuItem.delete({ where: { id: itemId } });
  }
}
