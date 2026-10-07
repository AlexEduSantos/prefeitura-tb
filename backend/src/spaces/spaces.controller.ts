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
import { SpacesService } from './spaces.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { SessionGuard } from '../auth/session.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { Action } from '../casl/action.enum';

@Controller('spaces')
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Get()
  async findAll() {
    return this.spacesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.spacesService.findOne(id);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.spacesService.findBySlug(slug);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'Space' as any))
  async create(@Body() createSpaceDto: CreateSpaceDto) {
    return this.spacesService.create(createSpaceDto);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Space' as any))
  async update(
    @Param('id') id: string,
    @Body() updateSpaceDto: UpdateSpaceDto,
  ) {
    return this.spacesService.update(id, updateSpaceDto);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Space' as any))
  async remove(@Param('id') id: string) {
    return this.spacesService.remove(id);
  }
}
