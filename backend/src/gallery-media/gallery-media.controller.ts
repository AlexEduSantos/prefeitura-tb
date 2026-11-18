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

@UseGuards(SessionGuard, PoliciesGuard)
@Controller('gallery-media')
export class GalleryMediaController {
  constructor(private readonly galleryMediaService: GalleryMediaService) {}

  @Get()
  @CheckPolicies((ability) => ability.can(Action.Read, 'GalleryMedia'))
  async findAll() {
    return this.galleryMediaService.findAll();
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can(Action.Read, 'GalleryMedia'))
  async findOne(@Param('id') id: string) {
    return this.galleryMediaService.findOne(id);
  }

  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'GalleryMedia'))
  async create(@Body() createGalleryMediaDto: CreateGalleryMediaDto) {
    return this.galleryMediaService.create(createGalleryMediaDto);
  }

  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'GalleryMedia'))
  async update(
    @Param('id') id: string,
    @Body() updateGalleryMediaDto: UpdateGalleryMediaDto,
  ) {
    return this.galleryMediaService.update(id, updateGalleryMediaDto);
  }

  @Delete(':id')
  @CheckPolicies(
    (ability) =>
      ability.can(Action.Delete, 'GalleryMedia') ||
      ability.can(Action.SoftDelete, 'GalleryMedia'),
  )
  async remove(@Param('id') id: string) {
    return this.galleryMediaService.remove(id);
  }
}
