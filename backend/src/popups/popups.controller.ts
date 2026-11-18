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
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { subject } from '@casl/ability';
import { PopupsService } from './popups.service';
import { CreatePopupDto } from './dto/create-popup.dto';
import { UpdatePopupDto } from './dto/update-popup.dto';
import { Action } from '../casl/action.enum';
import { SessionGuard } from '../auth/session.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';
import { extractRequestUser } from '../common/utils/workflow.util';

@Controller('popups')
export class PopupsController {
  constructor(
    private readonly popupsService: PopupsService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @Get()
  async findAll() {
    return this.popupsService.findAll();
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Get('admin')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Popups'))
  async findAllAdmin() {
    return this.popupsService.findAllAdmin();
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Get('admin/:id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Popups'))
  async findOneAdmin(@Param('id') id: string) {
    return this.popupsService.findOneAdmin(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.popupsService.findOne(id);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'Popups'))
  async create(@Body() createPopupDto: CreatePopupDto, @Request() req: any) {
    const { id: userId, role: userRole } = extractRequestUser(req);
    const ability = this.caslAbilityFactory.createForUser(req.user);
    if (!ability.can(Action.Create, subject('Popups', createPopupDto as any))) {
      throw new ForbiddenException(
        'Você não tem permissão para criar popups para esta secretaria.',
      );
    }
    return this.popupsService.create(createPopupDto, userId || '', userRole);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id/approve')
  @CheckPolicies((ability) => ability.can(Action.Approve, 'Popups'))
  async approve(
    @Param('id') id: string,
    @Body() body: { proposedData?: Record<string, any> },
    @Request() req: any,
  ) {
    const { id: approverId } = extractRequestUser(req);
    return this.popupsService.approve(id, approverId, body?.proposedData);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id/reject')
  @CheckPolicies((ability) => ability.can(Action.Approve, 'Popups'))
  async reject(
    @Param('id') id: string,
    @Body() body: { reason?: string; rejectionReason?: string },
    @Request() req: any,
  ) {
    const { id: approverId } = extractRequestUser(req);
    return this.popupsService.reject(
      id,
      approverId,
      body?.reason ?? body?.rejectionReason,
    );
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Popups'))
  async update(
    @Param('id') id: string,
    @Body() updatePopupDto: UpdatePopupDto,
    @Request() req: any,
  ) {
    const popup = await this.popupsService.findOneAdmin(id);
    const ability = this.caslAbilityFactory.createForUser(req.user);
    if (!ability.can(Action.Update, subject('Popups', popup))) {
      throw new ForbiddenException(
        'Você não possui permissão para editar este popup.',
      );
    }
    const { id: userId, role: userRole } = extractRequestUser(req);
    return this.popupsService.update(id, updatePopupDto, userRole, userId);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Delete(':id')
  @CheckPolicies(
    (ability) =>
      ability.can(Action.Delete, 'Popups') ||
      ability.can(Action.SoftDelete, 'Popups'),
  )
  async remove(
    @Param('id') id: string,
    @Request() req: any,
    @Query('hard') hard?: string,
  ) {
    const popup = await this.popupsService.findOneAdmin(id);
    const ability = this.caslAbilityFactory.createForUser(req.user);
    const wantHardDelete = hard === 'true';

    const hasPermission = wantHardDelete
      ? ability.can(Action.Delete, subject('Popups', popup))
      : ability.can(Action.Delete, subject('Popups', popup)) ||
        ability.can(Action.SoftDelete, subject('Popups', popup));

    if (!hasPermission) {
      throw new ForbiddenException(
        'Você não possui permissão para remover este popup.',
      );
    }
    const { id: userId, role: userRole } = extractRequestUser(req);
    return this.popupsService.remove(id, userRole, wantHardDelete, userId);
  }
}
