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
} from '@nestjs/common';
import { GalleriesService } from './galleries.service';
import { CreateGalleriesDto } from './dto/create-galleries.dto';
import { UpdateGalleriesDto } from './dto/update-galleries.dto';
import { Action } from '../casl/action.enum';
import { SessionGuard } from '../auth/session.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';

@Controller('galleries')
export class GalleriesController {
  constructor(private readonly galleriesService: GalleriesService) {}

  @Get()
  async findAll() {
    return this.galleriesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.galleriesService.findOne(id);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'Galleries'))
  async create(@Body() createGalleriesDto: CreateGalleriesDto, @Request() req) {
    // req.session.passport.user is typically where the user id is stored if you use passport
    // Adjust based on how you extract userId from session
    const userId =
      req.session.user?.id || req.user?.id || req.session.passport?.user;
    return this.galleriesService.create(createGalleriesDto, userId);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Galleries'))
  async update(
    @Param('id') id: string,
    @Body() updateGalleriesDto: UpdateGalleriesDto,
  ) {
    return this.galleriesService.update(id, updateGalleriesDto);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Galleries'))
  async remove(@Param('id') id: string) {
    return this.galleriesService.remove(id);
  }
}
