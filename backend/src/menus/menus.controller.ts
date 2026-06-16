import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  ParseArrayPipe,
} from '@nestjs/common';
import { MenusService } from './menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { MenuItemDto } from './dto/menu-item.dto';
import { SessionGuard } from '../auth/session.guard';
import { UserRole } from '@prisma/client';

@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  // 1. Endpoint de Busca Completa (GET /menus/location/:location?entityId=...)
  @Get('location/:location')
  async findByLocation(
    @Param('location') location: string,
    @Query('entityId') entityId: string,
  ) {
    return this.menusService.findByLocation(location, entityId);
  }

  @Get('')
  async findAll() {
    return this.menusService.findAll();
  }

  @Get('subitems')
  async findAllSubItems() {
    return this.menusService.findAllSubItems();
  }

  // 2. Endpoint de Criação de Menu (POST /menus)
  @UseGuards(SessionGuard)
  @Post()
  async create(@Body() createMenuDto: CreateMenuDto, @Request() req: any) {
    const user = req.user;

    // Se o usuário não for ADMIN, ele só pode criar menus para sua própria secretaria (entityId)
    if (
      user.role !== UserRole.ADMIN &&
      user.entityId !== createMenuDto.entityId
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para criar menus para esta secretaria.',
      );
    }

    return this.menusService.create(createMenuDto);
  }

  // 3. Endpoint de Criação/Atualização em Lote de Itens (POST/PUT /menus/:id/items)
  @UseGuards(SessionGuard)
  @Put(':id/items')
  async syncItemsPut(
    @Param('id') id: string,
    @Body(new ParseArrayPipe({ items: MenuItemDto })) items: MenuItemDto[],
    @Request() req: any,
  ) {
    const user = req.user;

    // Validar se o usuário tem permissão para esta secretaria
    const menu = await this.menusService.findOne(id);
    if (user.role !== UserRole.ADMIN && user.entityId !== menu.entityId) {
      throw new ForbiddenException(
        'Você não possui permissão para gerenciar os itens deste menu.',
      );
    }

    return this.menusService.syncItems(id, items);
  }

  @UseGuards(SessionGuard)
  @Post(':id/items')
  async syncItemsPost(
    @Param('id') id: string,
    @Body(new ParseArrayPipe({ items: MenuItemDto })) items: MenuItemDto[],
    @Request() req: any,
  ) {
    const user = req.user;

    // Validar se o usuário tem permissão para esta secretaria
    const menu = await this.menusService.findOne(id);
    if (user.role !== UserRole.ADMIN && user.entityId !== menu.entityId) {
      throw new ForbiddenException(
        'Você não possui permissão para gerenciar os itens deste menu.',
      );
    }

    return this.menusService.syncItems(id, items);
  }
}
