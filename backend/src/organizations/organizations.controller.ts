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
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { SessionGuard } from '../auth/session.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { Action } from '../casl/action.enum';
import { extractRequestUser } from '../common/utils/workflow.util';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @UseGuards(SessionGuard, PoliciesGuard)
  @Get('admin')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Organization'))
  async findAllAdmin(@Query('includeInactive') includeInactive?: string) {
    return this.organizationsService.findAllAdmin(includeInactive === 'true');
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Get('admin/tree')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Organization'))
  async findTreeAdmin(@Query('includeInactive') includeInactive?: string) {
    return this.organizationsService.findTreeAdmin(includeInactive || 'all');
  }

  @Get()
  async findAll() {
    return this.organizationsService.findAll(false);
  }

  @Get('tree')
  async findTree() {
    return this.organizationsService.findTree('active');
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
  @CheckPolicies(
    (ability) =>
      ability.can(Action.Delete, 'Organization') ||
      ability.can(Action.SoftDelete, 'Organization'),
  )
  async remove(
    @Param('id') id: string,
    @Request() req: any,
    @Query('hard') hard?: string,
  ) {
    const { role: userRole } = extractRequestUser(req);
    return this.organizationsService.remove(id, userRole, hard === 'true');
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
