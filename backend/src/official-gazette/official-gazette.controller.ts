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
  Req,
} from '@nestjs/common';
import { OfficialGazetteService } from './official-gazette.service';
import { CreateOfficialGazetteDto } from './dto/create-official-gazette.dto';
import { UpdateOfficialGazetteDto } from './dto/update-official-gazette.dto';
import { QueryOfficialGazetteDto } from './dto/query-official-gazette.dto';
import { SessionGuard } from '../auth/session.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { Action } from '../casl/action.enum';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';

@ApiTags('Official Gazette')
@Controller('official-gazette')
export class OfficialGazetteController {
  constructor(
    private readonly officialGazetteService: OfficialGazetteService,
  ) {}

  // ==========================================
  // 1. ENDPOINTS DE LEITURA (PÚBLICA E ADMIN)
  // ==========================================

  @Get()
  @ApiOperation({
    summary: 'Listagem de boletins oficiais para o portal público',
    description:
      'Retorna os boletins oficiais com ordenação cronológica decrescente. Aberto ao público sem autenticação.',
  })
  findAllPublic(@Query() query: QueryOfficialGazetteDto) {
    return this.officialGazetteService.findAllPublic(query);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Get('admin')
  @CheckPolicies((ability) => ability.can(Action.Read, 'OfficialGazette'))
  @ApiOperation({
    summary: 'Listagem de boletins oficiais para a área administrativa',
    description:
      'Retorna os boletins oficiais com dados completos de auditoria (criador e editor). Requer autenticação.',
  })
  findAllAdmin(@Query() query: QueryOfficialGazetteDto) {
    return this.officialGazetteService.findAllAdmin(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar detalhes de um boletim oficial por ID',
  })
  findOne(@Param('id') id: string) {
    return this.officialGazetteService.findOne(id);
  }

  // ==========================================
  // 2. ENDPOINTS DE ESCRITA (RESTRITOS A ADMIN E PUBLISHER)
  // ==========================================

  @UseGuards(SessionGuard, PoliciesGuard)
  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'OfficialGazette'))
  @ApiOperation({
    summary: 'Cadastrar nova edição do Diário/Boletim Oficial (ADMIN e PUBLISHER)',
  })
  @ApiResponse({ status: 201, description: 'Boletim cadastrado com sucesso.' })
  create(
    @Body() createOfficialGazetteDto: CreateOfficialGazetteDto,
    @Req() req: Request,
  ) {
    const user: any = req.user;
    return this.officialGazetteService.create(createOfficialGazetteDto, user.id);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'OfficialGazette'))
  @ApiOperation({
    summary: 'Atualizar edição do Diário/Boletim Oficial (ADMIN e PUBLISHER)',
  })
  update(
    @Param('id') id: string,
    @Body() updateOfficialGazetteDto: UpdateOfficialGazetteDto,
    @Req() req: Request,
  ) {
    const user: any = req.user;
    return this.officialGazetteService.update(
      id,
      updateOfficialGazetteDto,
      user.id,
    );
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'OfficialGazette'))
  @ApiOperation({
    summary: 'Excluir edição do Diário/Boletim Oficial (ADMIN e PUBLISHER)',
  })
  remove(@Param('id') id: string) {
    return this.officialGazetteService.remove(id);
  }
}

