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
import { EntitiesService } from './entities.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';
import { Action } from '../casl/action.enum';
import { PoliciesGuard } from '../casl/policies.guard';
import { SessionGuard } from '../auth/session.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';

@Controller('entities')
export class EntitiesController {
  constructor(private readonly entitiesService: EntitiesService) {}

  // Acesso público para listar todas as secretarias (Entities)
  @Get()
  async findAll() {
    return this.entitiesService.findAll();
  }

  // Acesso público para ver os detalhes de uma secretaria
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.entitiesService.findOne(id);
  }

  // Apenas Administradores (Admin) podem criar uma nova secretaria
  @UseGuards(SessionGuard, PoliciesGuard)
  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'Entity'))
  async create(@Body() createEntityDto: CreateEntityDto) {
    return this.entitiesService.create(createEntityDto);
  }

  // Apenas Administradores podem atualizar uma secretaria
  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Entity'))
  async update(
    @Param('id') id: string,
    @Body() updateEntityDto: UpdateEntityDto,
  ) {
    return this.entitiesService.update(id, updateEntityDto);
  }

  // Apenas Administradores podem excluir uma secretaria
  @UseGuards(SessionGuard, PoliciesGuard)
  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Entity'))
  async remove(@Param('id') id: string) {
    return this.entitiesService.remove(id);
  }
}
