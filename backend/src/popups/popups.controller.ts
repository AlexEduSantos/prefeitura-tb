import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PopupsService } from './popups.service';
import { CreatePopupDto } from './dto/create-popup.dto';
import { UpdatePopupDto } from './dto/update-popup.dto';
import { Action } from '../casl/action.enum';
import { SessionGuard } from '../auth/session.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';

@Controller('popups')
export class PopupsController {
  constructor(private readonly popupsService: PopupsService) {}

  @Get()
  async findAll() {
    return this.popupsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.popupsService.findOne(id);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'Popups'))
  async create(@Body() createPopupDto: CreatePopupDto, @Request() req) {
    const userId = req.session.user?.id || req.user?.id || req.session.passport?.user;
    return this.popupsService.create(createPopupDto, userId);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Popups'))
  async update(
    @Param('id') id: string,
    @Body() updatePopupDto: UpdatePopupDto,
  ) {
    return this.popupsService.update(id, updatePopupDto);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Popups'))
  async remove(@Param('id') id: string) {
    return this.popupsService.remove(id);
  }
}
