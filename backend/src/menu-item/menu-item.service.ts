import { Injectable, Optional } from '@nestjs/common';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ReorderMenuItemsDto } from './dto/reorder-menu-item.dto';
import { RedisCacheService } from '../common/cache/redis-cache.service';
import { UserRole } from '../generated/prisma/enums';

@Injectable()
export class MenuItemService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly cacheService?: RedisCacheService,
  ) {}

  async create(menuId: string, createMenuItemDto: CreateMenuItemDto) {
    const created = await this.prisma.menuItem.create({
      data: {
        ...createMenuItemDto,
        menuId,
      },
    });
    await this.cacheService?.invalidateByPrefix('cache:menus');
    return created;
  }

  findAll() {
    return this.prisma.menuItem.findMany({
      include: {
        menu: true,
        page: true,
        category: true,
        parent: true,
        children: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.menuItem.findUnique({
      where: { id },
      include: {
        menu: true,
        page: true,
        category: true,
        parent: true,
        children: true,
      },
    });
  }

  async update(id: string, updateMenuItemDto: UpdateMenuItemDto) {
    const updated = await this.prisma.menuItem.update({
      where: { id },
      data: updateMenuItemDto,
      include: {
        menu: true,
        page: true,
        category: true,
        parent: true,
        children: true,
      },
    });
    await this.cacheService?.invalidateByPrefix('cache:menus');
    return updated;
  }

  async remove(id: string, userRole?: UserRole, hardDelete = false) {
    const deleted =
      userRole === UserRole.ADMIN && hardDelete
        ? await this.prisma.menuItem.delete({ where: { id } })
        : await this.prisma.menuItem.update({
            where: { id },
            data: { visible: false },
          });
    await this.cacheService?.invalidateByPrefix('cache:menus');
    return deleted;
  }

  async reorder(reorderDto: ReorderMenuItemsDto) {
    const { items } = reorderDto;

    // Executa as atualizações em lote de forma atômica usando uma transação do Prisma
    const result = await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.menuItem.update({
          where: { id: item.id },
          data: {
            order: item.order,
            parentId: item.parentId, // Atualiza também caso o item tenha mudado de submenu/pai
          },
        }),
      ),
    );
    await this.cacheService?.invalidateByPrefix('cache:menus');
    return result;
  }
}
