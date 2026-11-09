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
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Action } from '../casl/action.enum';
import { SessionGuard } from '../auth/session.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

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
  ) {
    return this.articlesService.findAllAdmin(
      search,
      status,
      category,
      organizationId,
    );
  }

  // Qualquer um (Público) pode listar artigos publicados e vigentes
  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.articlesService.findAll(search, category, organizationId);
  }

  // Busca por ID (Painel Admin)
  @Get('id/:id')
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
  async create(@Body() createArticleDto: CreateArticleDto) {
    return this.articlesService.create(createArticleDto);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Article'))
  async update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return this.articlesService.update(id, updateArticleDto);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Article'))
  async remove(@Param('id') id: string) {
    return this.articlesService.remove(id);
  }
}
