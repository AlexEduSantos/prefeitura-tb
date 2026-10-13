import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { MenuItemService } from './menu-item.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { Action } from '../casl/action.enum';
import { SessionGuard } from '../auth/session.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { ReorderMenuItemsDto } from './dto/reorder-menu-item.dto';

@Controller('menu-item')
export class MenuItemController {
  constructor(private readonly menuItemService: MenuItemService) {}

  @UseGuards(SessionGuard, PoliciesGuard)
  @Post('create/:menuId')
  @CheckPolicies((ability) => ability.can(Action.Create, 'MenuItem' as any))
  create(
    @Param('menuId') menuId: string,
    @Body() createMenuItemDto: CreateMenuItemDto,
  ) {
    return this.menuItemService.create(menuId, createMenuItemDto);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch('reorder')
  @CheckPolicies((ability) => ability.can(Action.Update, 'MenuItem' as any))
  reorder(@Body() reorderMenuItemsDto: ReorderMenuItemsDto) {
    return this.menuItemService.reorder(reorderMenuItemsDto);
  }

  @Get()
  findAll() {
    return this.menuItemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menuItemService.findOne(id);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'MenuItem' as any))
  update(
    @Param('id') id: string,
    @Body() updateMenuItemDto: UpdateMenuItemDto,
  ) {
    return this.menuItemService.update(id, updateMenuItemDto);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'MenuItem' as any))
  remove(@Param('id') id: string) {
    return this.menuItemService.remove(id);
  }
}
