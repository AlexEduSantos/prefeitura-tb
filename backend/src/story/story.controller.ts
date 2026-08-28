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
import { StoryService } from './story.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { SessionGuard } from '../auth/session.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { Action } from '../casl/action.enum';

@Controller('story')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Post()
  @UseGuards(SessionGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Create, 'Story'))
  async create(@Body() createStoryDto: CreateStoryDto, @Request() req) {
    const userId =
      req.session.user?.id || req.user?.id || req.session.passport?.user;
    return this.storyService.create(createStoryDto, userId);
  }

  @Get()
  findAll() {
    return this.storyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storyService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(SessionGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Update, 'Story'))
  async update(
    @Param('id') id: string,
    @Body() updateStoryDto: UpdateStoryDto,
  ) {
    return this.storyService.update(id, updateStoryDto);
  }

  @Delete(':id')
  @UseGuards(SessionGuard, PoliciesGuard)
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Story'))
  remove(@Param('id') id: string) {
    return this.storyService.remove(id);
  }
}
