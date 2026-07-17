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
import { GalleryMediaService } from './gallery-media.service';
import { CreateGalleryMediaDto } from './dto/create-gallery-media.dto';
import { UpdateGalleryMediaDto } from './dto/update-gallery-media.dto';
import { Action } from '../casl/action.enum';
import { SessionGuard } from '../auth/session.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';

@Controller('gallery-media')
export class GalleryMediaController {
  constructor(private readonly galleryMediaService: GalleryMediaService) {}

  @Get()
  async findAll() {
    return this.galleryMediaService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.galleryMediaService.findOne(id);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'Galleries'))
  async create(@Body() createGalleryMediaDto: CreateGalleryMediaDto) {
    return this.galleryMediaService.create(createGalleryMediaDto);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Galleries'))
  async update(
    @Param('id') id: string,
    @Body() updateGalleryMediaDto: UpdateGalleryMediaDto,
  ) {
    return this.galleryMediaService.update(id, updateGalleryMediaDto);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Galleries'))
  async remove(@Param('id') id: string) {
    return this.galleryMediaService.remove(id);
  }
}
