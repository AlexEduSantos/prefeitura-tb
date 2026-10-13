import { Injectable } from '@nestjs/common';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ReorderMenuItemsDto } from './dto/reorder-menu-item.dto';

@Injectable()
export class MenuItemService {
  constructor(private readonly prisma: PrismaService) {}

  create(menuId: string, createMenuItemDto: CreateMenuItemDto) {
    return this.prisma.menuItem.create({
      data: {
        ...createMenuItemDto,
        menuId,
      },
    });
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

  update(id: string, updateMenuItemDto: UpdateMenuItemDto) {
    return this.prisma.menuItem.update({
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
  }

  remove(id: string) {
    return this.prisma.menuItem.delete({
      where: { id },
    });
  }

  async reorder(reorderDto: ReorderMenuItemsDto) {
    const { items } = reorderDto;

    // Executa as atualizações em lote de forma atômica usando uma transação do Prisma
    return this.prisma.$transaction(
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
  }
}
