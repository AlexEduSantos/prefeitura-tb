import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { subject } from '@casl/ability';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Action } from '../casl/action.enum';
import { SessionGuard } from '../auth/session.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';
import { extractRequestUser } from '../common/utils/workflow.util';

@Controller('articles')
export class ArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  // Listagem ADMINISTRATIVA (Dashboard) - Traz todos os artigos menos os excluídos por padrão
  // DEVE ser declarada ANTES de @Get(':slug') para evitar captura de rota!
  @UseGuards(SessionGuard, PoliciesGuard)
  @Get('admin')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Article'))
  async findAllAdmin(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('organizationId') organizationId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.articlesService.findAllAdmin(
      search,
      status,
      category,
      organizationId,
      { page, limit, skip, take },
    );
  }

  // Qualquer um (Público) pode listar artigos publicados e vigentes
  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('organizationId') organizationId?: string,
    @Query('type') type?: string,
    @Query('authorId') authorId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.articlesService.findAll(
      search,
      category,
      organizationId,
      type,
      authorId,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    );
  }

  // Busca por ID (Painel Admin)
  @UseGuards(SessionGuard, PoliciesGuard)
  @Get('id/:id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Article'))
  async findOneById(@Param('id') id: string) {
    return this.articlesService.findOneById(id);
  }

  // Qualquer um (Público) pode visualizar os detalhes de um artigo publicado
  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return this.articlesService.findOne(slug);
  }

  // Operações de Mutação exigem sessão ativa e autorização do CASL
  @UseGuards(SessionGuard, PoliciesGuard)
  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'Article'))
  async create(
    @Body() createArticleDto: CreateArticleDto,
    @Request() req: any,
  ) {
    const { role: userRole } = extractRequestUser(req);
    const ability = this.caslAbilityFactory.createForUser(req.user);
    if (
      !ability.can(Action.Create, subject('Article', createArticleDto as any))
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para criar notícias para esta secretaria.',
      );
    }
    return this.articlesService.create(createArticleDto, userRole);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id/approve')
  @CheckPolicies((ability) => ability.can(Action.Approve, 'Article'))
  async approve(@Param('id') id: string, @Request() req: any) {
    const { id: approverId } = extractRequestUser(req);
    return this.articlesService.approve(id, approverId);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id/reject')
  @CheckPolicies((ability) => ability.can(Action.Approve, 'Article'))
  async reject(@Param('id') id: string, @Request() req: any) {
    const { id: approverId } = extractRequestUser(req);
    return this.articlesService.reject(id, approverId);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Article'))
  async update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @Request() req: any,
  ) {
    const article = await this.articlesService.findOneById(id);
    const ability = this.caslAbilityFactory.createForUser(req.user);
    if (!ability.can(Action.Update, subject('Article', article))) {
      throw new ForbiddenException(
        'Você não possui permissão para editar esta notícia.',
      );
    }
    const { role: userRole } = extractRequestUser(req);
    return this.articlesService.update(id, updateArticleDto, userRole);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Delete(':id')
  @CheckPolicies(
    (ability) =>
      ability.can(Action.Delete, 'Article') ||
      ability.can(Action.SoftDelete, 'Article'),
  )
  async remove(
    @Param('id') id: string,
    @Request() req: any,
    @Query('hard') hard?: string,
  ) {
    const article = await this.articlesService.findOneById(id);
    const ability = this.caslAbilityFactory.createForUser(req.user);
    const wantHardDelete = hard === 'true';

    const hasPermission = wantHardDelete
      ? ability.can(Action.Delete, subject('Article', article))
      : ability.can(Action.Delete, subject('Article', article)) ||
        ability.can(Action.SoftDelete, subject('Article', article));

    if (!hasPermission) {
      throw new ForbiddenException(
        'Você não possui permissão para excluir esta notícia.',
      );
    }

    const { role: userRole } = extractRequestUser(req);
    return this.articlesService.remove(id, userRole, wantHardDelete);
  }
}
