import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { subject } from '@casl/ability';
import { ServicesService } from './services.service';
import { SessionGuard } from '../auth/session.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';
import { Action } from '../casl/action.enum';
import { CreateServiceDto } from './dto/create-services.dto';
import { UpdateServiceDto } from './dto/update-serviecs.dto';
import { extractRequestUser } from '../common/utils/workflow.util';

@Controller('services')
export class ServiceController {
  constructor(
    private readonly serviceService: ServicesService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @UseGuards(SessionGuard, PoliciesGuard)
  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, 'Services'))
  async findAll() {
    return this.serviceService.findAll();
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Get('admin')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Services'))
  async findAllAdmin() {
    return this.serviceService.findAll();
  }

  @Get('public')
  async findPublic(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('title') title: string,
  ) {
    return this.serviceService.findAllPublic(page, limit, title);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Get('admin/:id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Services'))
  async findOneAdmin(@Param('id') id: string) {
    return this.serviceService.findOne(id);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Services'))
  async findOne(@Param('id') id: string) {
    return this.serviceService.findOne(id);
  }

  @Post()
  @UseGuards(SessionGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Create, 'Services'))
  async create(
    @Body() createServiceDto: CreateServiceDto,
    @Request() req: any,
  ) {
    const { id: userId, role: userRole } = extractRequestUser(req);
    const ability = this.caslAbilityFactory.createForUser(req.user);
    if (
      !ability.can(Action.Create, subject('Services', createServiceDto as any))
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para criar serviços para esta secretaria.',
      );
    }
    return this.serviceService.create(createServiceDto, userId || '', userRole);
  }

  @Patch(':id/approve')
  @UseGuards(SessionGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Approve, 'Services'))
  async approve(
    @Param('id') id: string,
    @Body() body: { proposedData?: Record<string, any> },
    @Request() req: any,
  ) {
    const { id: approverId } = extractRequestUser(req);
    return this.serviceService.approve(id, approverId, body?.proposedData);
  }

  @Patch(':id/reject')
  @UseGuards(SessionGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Approve, 'Services'))
  async reject(
    @Param('id') id: string,
    @Body() body: { reason?: string; rejectionReason?: string },
    @Request() req: any,
  ) {
    const { id: approverId } = extractRequestUser(req);
    return this.serviceService.reject(
      id,
      approverId,
      body?.reason ?? body?.rejectionReason,
    );
  }

  @Patch(':id')
  @UseGuards(SessionGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Update, 'Services'))
  async update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @Request() req: any,
  ) {
    const service = await this.serviceService.findOne(id);
    const ability = this.caslAbilityFactory.createForUser(req.user);
    if (!ability.can(Action.Update, subject('Services', service))) {
      throw new ForbiddenException(
        'Você não possui permissão para editar este serviço.',
      );
    }
    const { id: userId, role: userRole } = extractRequestUser(req);
    return this.serviceService.update(id, updateServiceDto, userId, userRole);
  }

  @Delete(':id')
  @UseGuards(SessionGuard, PoliciesGuard)
  @CheckPolicies(
    (ability) =>
      ability.can(Action.Delete, 'Services') ||
      ability.can(Action.SoftDelete, 'Services'),
  )
  async remove(
    @Param('id') id: string,
    @Request() req: any,
    @Query('hard') hard?: string,
  ) {
    const service = await this.serviceService.findOne(id);
    const ability = this.caslAbilityFactory.createForUser(req.user);
    const wantHardDelete = hard === 'true';

    const hasPermission = wantHardDelete
      ? ability.can(Action.Delete, subject('Services', service))
      : ability.can(Action.Delete, subject('Services', service)) ||
        ability.can(Action.SoftDelete, subject('Services', service));

    if (!hasPermission) {
      throw new ForbiddenException(
        'Você não possui permissão para remover este serviço.',
      );
    }
    const { id: userId, role: userRole } = extractRequestUser(req);
    return this.serviceService.remove(id, userRole, wantHardDelete, userId);
  }
}
