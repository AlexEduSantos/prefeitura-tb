import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
  ParseEnumPipe,
  BadRequestException,
  Patch,
} from '@nestjs/common';
import { MenusService } from './menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { SessionGuard } from '../auth/session.guard';
import { UserRole } from '@prisma/client';

@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  // ---------- MENU ENDPOINTS ----------

  @Get()
  async findAllMenus(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder', new ParseEnumPipe(['asc', 'desc'], { optional: true }))
    sortOrder?: 'asc' | 'desc',
    @Query('location') location?: string,
    @Query('entityId') entityId?: string,
    @Query('name') name?: string,
  ) {
    // Validate sortBy to prevent injection (whitelist fields)
    const allowedSortFields = ['name', 'location', 'createdAt', 'updatedAt'];
    if (sortBy && !allowedSortFields.includes(sortBy)) {
      throw new BadRequestException(`Invalid sort field: ${sortBy}`);
    }
    return this.menusService.findAllMenus({
      page,
      limit,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'asc',
      location,
      entityId,
      name,
    });
  }

  @Get(':id')
  async findOneMenu(@Param('id', ParseUUIDPipe) id: string) {
    return this.menusService.findOneMenu(id);
  }

  @Get('by-location/:entityId/:location')
  async findOneMenuByLocation(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('location') location: string,
  ) {
    return this.menusService.findOneMenuByLocation(entityId, location);
  }

  @UseGuards(SessionGuard)
  @Post()
  async createMenu(@Body() createMenuDto: CreateMenuDto, @Request() req: any) {
    const user = req.user;
    if (
      user.role !== UserRole.ADMIN &&
      user.entityId !== createMenuDto.entityId
    ) {
      throw new ForbiddenException(
        'You are not allowed to create menu for this entity',
      );
    }
    return this.menusService.createMenu(createMenuDto);
  }

  @UseGuards(SessionGuard)
  @Patch(':id')
  async updateMenu(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMenuDto: UpdateMenuDto,
    @Request() req: any,
  ) {
    const user = req.user;
    const menu = await this.menusService.findOneMenu(id);
    if (user.role !== UserRole.ADMIN && user.entityId !== menu.entityId) {
      throw new ForbiddenException(
        'Você não tem permissão para atualizar este menu',
      );
    }
    return this.menusService.updateMenu(id, updateMenuDto);
  }

  @UseGuards(SessionGuard)
  @Delete(':id')
  async deleteMenu(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const user = req.user;
    const menu = await this.menusService.findOneMenu(id);
    if (user.role !== UserRole.ADMIN && user.entityId !== menu.entityId) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir este menu',
      );
    }
    return this.menusService.deleteMenu(id);
  }

  // ---------- MENU ITEM ENDPOINTS ----------

  @Get('menuItems/all')
  async findAllMenuItems() {
    return this.menusService.findAllMenuItems();
  }

  @Get(':menuId/items')
  async findAllMenuItemsByMenuId(
    @Param('menuId', ParseUUIDPipe) menuId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder', new ParseEnumPipe(['asc', 'desc'], { optional: true }))
    sortOrder?: 'asc' | 'desc',
    @Query('label') label?: string,
    @Query('parentId') parentId?: string,
  ) {
    const allowedSortFields = ['label', 'order', 'createdAt', 'updatedAt'];
    if (sortBy && !allowedSortFields.includes(sortBy)) {
      throw new BadRequestException(`Invalid sort field: ${sortBy}`);
    }
    return this.menusService.findAllMenuItemsByMenuId(menuId, {
      page,
      limit,
      sortBy: sortBy || 'order',
      sortOrder: sortOrder || 'asc',
      label,
      parentId,
    });
  }

  @Get(':menuId/items/:itemId')
  async findOneMenuItem(
    @Param('menuId', ParseUUIDPipe) menuId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.menusService.findOneMenuItem(menuId, itemId);
  }

  @UseGuards(SessionGuard)
  @Post(':menuId/items')
  async createMenuItem(
    @Param('menuId', ParseUUIDPipe) menuId: string,
    @Body() createMenuItemDto: CreateMenuItemDto,
    @Request() req: any,
  ) {
    const user = req.user;
    const menu = await this.menusService.findOneMenu(menuId);
    if (user.role !== UserRole.ADMIN && user.entityId !== menu.entityId) {
      throw new ForbiddenException(
        'You are not allowed to manage items of this menu',
      );
    }
    return this.menusService.createMenuItem(menuId, createMenuItemDto);
  }

  @UseGuards(SessionGuard)
  @Patch(':menuId/items/:itemId')
  async updateMenuItem(
    @Param('menuId', ParseUUIDPipe) menuId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() updateMenuItemDto: UpdateMenuItemDto,
    @Request() req: any,
  ) {
    const user = req.user;
    const menu = await this.menusService.findOneMenu(menuId);
    if (user.role !== UserRole.ADMIN && user.entityId !== menu.entityId) {
      throw new ForbiddenException(
        'You are not allowed to manage items of this menu',
      );
    }
    return this.menusService.updateMenuItem(menuId, itemId, updateMenuItemDto);
  }

  @UseGuards(SessionGuard)
  @Delete(':menuId/items/:itemId')
  async deleteMenuItem(
    @Param('menuId', ParseUUIDPipe) menuId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Request() req: any,
  ) {
    const user = req.user;
    const menu = await this.menusService.findOneMenu(menuId);
    if (user.role !== UserRole.ADMIN && user.entityId !== menu.entityId) {
      throw new ForbiddenException(
        'You are not allowed to manage items of this menu',
      );
    }
    return this.menusService.deleteMenuItem(menuId, itemId);
  }
}
