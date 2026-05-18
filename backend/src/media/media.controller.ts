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
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { SessionGuard } from 'src/auth/session.guard';
import { PoliciesGuard } from 'src/casl/policies.guard';
import { CheckPolicies } from 'src/casl/check-policies.decorator';
import { Action } from 'src/casl/action.enum';

@Controller('media')
@UseGuards(SessionGuard, PoliciesGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, 'Media'))
  async findAll() {
    return this.mediaService.findAll();
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Media'))
  async findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'Media'))
  async create(@Body() createMediaDto: CreateMediaDto) {
    return this.mediaService.create(createMediaDto);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Media'))
  async update(
    @Param('id') id: string,
    @Body() updateMediaDto: UpdateMediaDto,
  ) {
    return this.mediaService.update(id, updateMediaDto);
  }

  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Media'))
  async remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }
}
