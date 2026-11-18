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
import { PagesService } from './pages.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { SessionGuard } from '../auth/session.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';
import { Action } from '../casl/action.enum';
import { subject } from '@casl/ability';
import { extractRequestUser } from '../common/utils/workflow.util';

@Controller('pages')
export class PagesController {
  constructor(
    private readonly pagesService: PagesService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  // Listagem administrativa de páginas (requer sessão e permissão Page:Read)
  @UseGuards(SessionGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Page'))
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.pagesService.findAll({ page, limit, skip, take });
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Page'))
  @Get('admin')
  async findAllAdminAlias(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.pagesService.findAll({ page, limit, skip, take });
  }

  @Get('public')
  async findPublic(@Query('search') search: string) {
    return this.pagesService.findPublicPages(search);
  }

  // Rota pública para buscar página raiz (sem espaço): ex /historia
  @Get('public/root/:slug')
  async findByRootSlug(@Param('slug') slug: string) {
    return this.pagesService.findByRoute(null, slug);
  }

  // Rota pública para buscar página por espaço: ex /educacao/matriculas
  @Get('public/:spaceSlug/:slug')
  async findBySpaceAndSlug(
    @Param('spaceSlug') spaceSlug: string,
    @Param('slug') slug: string,
  ) {
    return this.pagesService.findByRoute(spaceSlug, slug);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Page'))
  @Get('admin/:id')
  async findOneAdmin(@Param('id') id: string) {
    return this.pagesService.findOne(id);
  }

  // Detalhes administrativos de uma página por ID (requer sessão e permissão)
  @UseGuards(SessionGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Read, 'Page'))
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.pagesService.findOne(id);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Post()
  async create(@Body() createPageDto: CreatePageDto, @Request() req: any) {
    const { id: userId, role: userRole } = extractRequestUser(req);
    const ability = this.caslAbilityFactory.createForUser(req.user);

    if (!ability.can(Action.Create, subject('Page', createPageDto as any))) {
      throw new ForbiddenException(
        'Você não tem permissão para criar páginas para esta secretaria.',
      );
    }

    return this.pagesService.create(createPageDto, userId, userRole);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id/approve')
  @CheckPolicies((ability) => ability.can(Action.Approve, 'Page'))
  async approve(
    @Param('id') id: string,
    @Body() body: { proposedData?: Record<string, any> },
    @Request() req: any,
  ) {
    const { id: approverId } = extractRequestUser(req);
    return this.pagesService.approve(id, approverId, body?.proposedData);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id/reject')
  @CheckPolicies((ability) => ability.can(Action.Approve, 'Page'))
  async reject(
    @Param('id') id: string,
    @Body() body: { reason?: string; rejectionReason?: string },
    @Request() req: any,
  ) {
    const { id: approverId } = extractRequestUser(req);
    return this.pagesService.reject(
      id,
      approverId,
      body?.reason ?? body?.rejectionReason,
    );
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePageDto: UpdatePageDto,
    @Request() req: any,
  ) {
    const page = await this.pagesService.findOne(id);
    const { id: userId, role: userRole } = extractRequestUser(req);
    const ability = this.caslAbilityFactory.createForUser(req.user);

    if (!ability.can(Action.Update, subject('Page', page))) {
      throw new ForbiddenException(
        'Você não possui permissão para editar esta página.',
      );
    }

    return this.pagesService.update(id, updatePageDto, userRole, userId);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() req: any,
    @Query('hard') hard?: string,
  ) {
    const page = await this.pagesService.findOne(id);
    const { id: userId, role: userRole } = extractRequestUser(req);
    const ability = this.caslAbilityFactory.createForUser(req.user);
    const wantHardDelete = hard === 'true';

    const hasPermission = wantHardDelete
      ? ability.can(Action.Delete, subject('Page', page))
      : ability.can(Action.Delete, subject('Page', page)) ||
        ability.can(Action.SoftDelete, subject('Page', page));

    if (!hasPermission) {
      throw new ForbiddenException(
        'Você não possui permissão para remover esta página.',
      );
    }

    return this.pagesService.remove(id, userRole, wantHardDelete, userId);
  }
}
