import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { SessionGuard } from '../auth/session.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { Action } from '../casl/action.enum';
import { CreateServiceDto } from './dto/create-services.dto';
import { UpdateServiceDto } from './dto/update-serviecs.dto';

@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServicesService) {}

  @Get()
  async findAll() {
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

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.serviceService.findOne(id);
  }

  @Post()
  @UseGuards(SessionGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Create, 'Services'))
  async create(@Body() createServiceDto: CreateServiceDto, @Request() req) {
    const userId =
      req.session.user?.id || req.user?.id || req.session.passport?.user;
    return this.serviceService.create(createServiceDto, userId);
  }

  @Patch(':id')
  @UseGuards(SessionGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Update, 'Services'))
  async update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @Request() req,
  ) {
    const userId =
      req.session.user?.id || req.user?.id || req.session.passport?.user;
    return this.serviceService.update(id, updateServiceDto, userId);
  }

  @Delete(':id')
  @UseGuards(SessionGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Services'))
  async remove(@Param('id') id: string) {
    return this.serviceService.remove(id);
  }
}
