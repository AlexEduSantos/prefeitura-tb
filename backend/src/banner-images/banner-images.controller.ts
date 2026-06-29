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
import { BannerImagesService } from './banner-images.service';
import { CreateBannerImageDto } from './dto/create-banner-image.dto';
import { UpdateBannerImageDto } from './dto/update-banner-image.dto';
import { Action } from '../casl/action.enum';
import { SessionGuard } from '../auth/session.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';

@Controller('banner-images')
export class BannerImagesController {
  constructor(private readonly bannerImagesService: BannerImagesService) {}

  @Get()
  async findAll() {
    return this.bannerImagesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.bannerImagesService.findOne(id);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'Banners'))
  async create(@Body() createBannerImageDto: CreateBannerImageDto) {
    return this.bannerImagesService.create(createBannerImageDto);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Banners'))
  async update(
    @Param('id') id: string,
    @Body() updateBannerImageDto: UpdateBannerImageDto,
  ) {
    return this.bannerImagesService.update(id, updateBannerImageDto);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Banners'))
  async remove(@Param('id') id: string) {
    return this.bannerImagesService.remove(id);
  }
}
