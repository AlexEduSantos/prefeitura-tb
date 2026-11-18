import {
  BadRequestException,
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
import { ALLOWED_MENU_FILTER_FIELDS, MenusService } from './menu.service';
import { SessionGuard } from '../auth/session.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { Action } from '../casl/action.enum';
import { CreateMenuDto } from './dto/create-menu.dto';
import { extractRequestUser } from '../common/utils/workflow.util';

@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @UseGuards(SessionGuard, PoliciesGuard)
  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'Menu'))
  create(@Body() createMenuDto: CreateMenuDto) {
    return this.menusService.create(createMenuDto);
  }

  @Get('by/:field/:value')
  findBy(@Param('field') field: string, @Param('value') value: string) {
    if (!ALLOWED_MENU_FILTER_FIELDS.includes(field as any)) {
      throw new BadRequestException(`Campo de filtro não permitido: ${field}`);
    }
    return this.menusService.findBy(field, value);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, 'Menu'))
  findAll() {
    return this.menusService.findAll();
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Get('admin')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Menu'))
  findAllAdmin() {
    return this.menusService.findAll();
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Menu'))
  findOne(@Param('id') id: string) {
    return this.menusService.findOne(id);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Menu'))
  update(@Param('id') id: string, @Body() updateMenuDto: CreateMenuDto) {
    return this.menusService.update(id, updateMenuDto);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Delete(':id')
  @CheckPolicies(
    (ability) =>
      ability.can(Action.Delete, 'Menu') ||
      ability.can(Action.SoftDelete, 'Menu'),
  )
  remove(
    @Param('id') id: string,
    @Request() req: any,
    @Query('hard') hard?: string,
  ) {
    const { role: userRole } = extractRequestUser(req);
    return this.menusService.remove(id, userRole, hard === 'true');
  }
}
