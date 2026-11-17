import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { SessionGuard } from '../auth/session.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { Action } from '../casl/action.enum';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  async findAll(@Query('includeInactive') includeInactive?: string) {
    return this.organizationsService.findAll(includeInactive === 'true');
  }

  @Get('tree')
  async findTree(@Query('includeInactive') includeInactive?: string) {
    return this.organizationsService.findTree(includeInactive || 'active');
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Get(':id/descendants')
  async getDescendants(@Param('id') id: string) {
    return this.organizationsService.getDescendantIds(id);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'Organization'))
  async create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Organization'))
  async update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, updateOrganizationDto);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Organization'))
  async remove(@Param('id') id: string) {
    return this.organizationsService.remove(id);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id/activate')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Organization'))
  async softDelete(@Param('id') id: string) {
    return this.organizationsService.activate(id);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id/change-parent')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Organization'))
  async changeParent(
    @Param('id') id: string,
    @Body('parentId') parentId: string | null,
  ) {
    return this.organizationsService.changeParent(id, parentId);
  }
}
