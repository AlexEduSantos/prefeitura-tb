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
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { Action } from '../casl/action.enum';
import { SessionGuard } from '../auth/session.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';

@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  async findAll() {
    return this.bannersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.bannersService.findOne(id);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'Banners'))
  async create(@Body() createBannerDto: CreateBannerDto, @Request() req) {
    // req.session.passport.user is typically where the user id is stored if you use passport
    // Adjust based on how you extract userId from session
    const userId = req.session.user?.id || req.user?.id || req.session.passport?.user;
    return this.bannersService.create(createBannerDto, userId);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Banners'))
  async update(
    @Param('id') id: string,
    @Body() updateBannerDto: UpdateBannerDto,
  ) {
    return this.bannersService.update(id, updateBannerDto);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Banners'))
  async remove(@Param('id') id: string) {
    return this.bannersService.remove(id);
  }
}
