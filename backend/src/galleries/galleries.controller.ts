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
import { GalleriesService } from './galleries.service';
import { CreateGalleriesDto } from './dto/create-galleries.dto';
import { UpdateGalleriesDto } from './dto/update-galleries.dto';
import { Action } from '../casl/action.enum';
import { SessionGuard } from '../auth/session.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';
import { extractRequestUser } from '../common/utils/workflow.util';

@Controller('galleries')
export class GalleriesController {
  constructor(
    private readonly galleriesService: GalleriesService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @Get()
  async findAll() {
    return this.galleriesService.findAll();
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Get('admin')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Galleries'))
  async findAllAdmin() {
    return this.galleriesService.findAllAdmin();
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Get('admin/:id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Galleries'))
  async findOneAdmin(@Param('id') id: string) {
    return this.galleriesService.findOneAdmin(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.galleriesService.findOne(id);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'Galleries'))
  async create(
    @Body() createGalleriesDto: CreateGalleriesDto,
    @Request() req: any,
  ) {
    const { id: userId, role: userRole } = extractRequestUser(req);
    const ability = this.caslAbilityFactory.createForUser(req.user);
    if (
      !ability.can(
        Action.Create,
        subject('Galleries', createGalleriesDto as any),
      )
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para criar galerias para esta secretaria.',
      );
    }
    return this.galleriesService.create(
      createGalleriesDto,
      userId || '',
      userRole,
    );
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id/approve')
  @CheckPolicies((ability) => ability.can(Action.Approve, 'Galleries'))
  async approve(@Param('id') id: string, @Request() req: any) {
    const { id: approverId } = extractRequestUser(req);
    return this.galleriesService.approve(id, approverId);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id/reject')
  @CheckPolicies((ability) => ability.can(Action.Approve, 'Galleries'))
  async reject(@Param('id') id: string, @Request() req: any) {
    const { id: approverId } = extractRequestUser(req);
    return this.galleriesService.reject(id, approverId);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Galleries'))
  async update(
    @Param('id') id: string,
    @Body() updateGalleriesDto: UpdateGalleriesDto,
    @Request() req: any,
  ) {
    const gallery = await this.galleriesService.findOneAdmin(id);
    const ability = this.caslAbilityFactory.createForUser(req.user);
    if (!ability.can(Action.Update, subject('Galleries', gallery))) {
      throw new ForbiddenException(
        'Você não possui permissão para editar esta galeria.',
      );
    }
    const { role: userRole } = extractRequestUser(req);
    return this.galleriesService.update(id, updateGalleriesDto, userRole);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Delete(':id')
  @CheckPolicies(
    (ability) =>
      ability.can(Action.Delete, 'Galleries') ||
      ability.can(Action.SoftDelete, 'Galleries'),
  )
  async remove(
    @Param('id') id: string,
    @Request() req: any,
    @Query('hard') hard?: string,
  ) {
    const gallery = await this.galleriesService.findOneAdmin(id);
    const ability = this.caslAbilityFactory.createForUser(req.user);
    const wantHardDelete = hard === 'true';

    const hasPermission = wantHardDelete
      ? ability.can(Action.Delete, subject('Galleries', gallery))
      : ability.can(Action.Delete, subject('Galleries', gallery)) ||
        ability.can(Action.SoftDelete, subject('Galleries', gallery));

    if (!hasPermission) {
      throw new ForbiddenException(
        'Você não possui permissão para remover esta galeria.',
      );
    }
    const { role: userRole } = extractRequestUser(req);
    return this.galleriesService.remove(id, userRole, wantHardDelete);
  }
}
