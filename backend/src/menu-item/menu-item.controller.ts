import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
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
import { extractRequestUser } from '../common/utils/workflow.util';

@Controller('menu-item')
export class MenuItemController {
  constructor(private readonly menuItemService: MenuItemService) {}

  @UseGuards(SessionGuard, PoliciesGuard)
  @Post('create/:menuId')
  @CheckPolicies((ability) => ability.can(Action.Create, 'MenuItem'))
  create(
    @Param('menuId') menuId: string,
    @Body() createMenuItemDto: CreateMenuItemDto,
  ) {
    return this.menuItemService.create(menuId, createMenuItemDto);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch('reorder')
  @CheckPolicies((ability) => ability.can(Action.Update, 'MenuItem'))
  reorder(@Body() reorderMenuItemsDto: ReorderMenuItemsDto) {
    return this.menuItemService.reorder(reorderMenuItemsDto);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, 'MenuItem'))
  findAll() {
    return this.menuItemService.findAll();
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'MenuItem'))
  findOne(@Param('id') id: string) {
    return this.menuItemService.findOne(id);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'MenuItem'))
  update(
    @Param('id') id: string,
    @Body() updateMenuItemDto: UpdateMenuItemDto,
  ) {
    return this.menuItemService.update(id, updateMenuItemDto);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Delete(':id')
  @CheckPolicies(
    (ability) =>
      ability.can(Action.Delete, 'MenuItem') ||
      ability.can(Action.SoftDelete, 'MenuItem'),
  )
  remove(
    @Param('id') id: string,
    @Request() req: any,
    @Query('hard') hard?: string,
  ) {
    const { role: userRole } = extractRequestUser(req);
    return this.menuItemService.remove(id, userRole, hard === 'true');
  }
}
