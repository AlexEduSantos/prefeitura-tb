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
} from '@nestjs/common';
import { PagesService } from './pages.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { SessionGuard } from 'src/auth/session.guard';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory';
import { Action } from 'src/casl/action.enum';
import { subject } from '@casl/ability';

@Controller('pages')
export class PagesController {
  constructor(
    private readonly pagesService: PagesService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  // Qualquer um (Público) pode visualizar a lista de páginas
  @Get()
  async findAll() {
    return this.pagesService.findAll();
  }

  // Qualquer um (Público) pode visualizar os detalhes de uma página
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.pagesService.findOne(id);
  }

  // Operações de Mutação exigem autenticação do usuário
  @UseGuards(SessionGuard)
  @Post()
  async create(@Body() createPageDto: CreatePageDto, @Request() req: any) {
    const ability = this.caslAbilityFactory.createForUser(req.user);

    // Validação ABAC na Criação:
    // Garante que o usuário tem permissão para associar a nova página à secretaria especificada (entityId)
    if (!ability.can(Action.Create, subject('Page', createPageDto as any))) {
      throw new ForbiddenException(
        'Você não tem permissão para criar páginas para esta secretaria.',
      );
    }

    return this.pagesService.create(createPageDto);
  }

  @UseGuards(SessionGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePageDto: UpdatePageDto,
    @Request() req: any,
  ) {
    const page = await this.pagesService.findOne(id);
    const ability = this.caslAbilityFactory.createForUser(req.user);

    // Validação ABAC na Atualização:
    // Garante que o usuário só consiga atualizar se pertencer à mesma secretaria (Page.entityId == User.entityId),
    // a menos que seja um Administrador com permissões completas
    if (!ability.can(Action.Update, subject('Page', page))) {
      throw new ForbiddenException(
        'Você não possui permissão para editar esta página.',
      );
    }

    return this.pagesService.update(id, updatePageDto);
  }

  @UseGuards(SessionGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const page = await this.pagesService.findOne(id);
    const ability = this.caslAbilityFactory.createForUser(req.user);

    // Validação ABAC na Deleção:
    // Garante que o usuário só consiga deletar a página de sua própria secretaria
    if (!ability.can(Action.Delete, subject('Page', page))) {
      throw new ForbiddenException(
        'Você não possui permissão para deletar esta página.',
      );
    }

    return this.pagesService.remove(id);
  }
}
