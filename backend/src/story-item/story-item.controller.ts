import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { StoryItemService } from './story-item.service';
import { CreateStoryItemDto } from './dto/create-story-item.dto';
import { UpdateStoryItemDto } from './dto/update-story-item.dto';

@Controller('story-item')
export class StoryItemController {
  constructor(private readonly storyItemService: StoryItemService) {}

  @Post()
  create(@Body() createStoryItemDto: CreateStoryItemDto) {
    return this.storyItemService.create(createStoryItemDto);
  }

  @Get()
  findAll() {
    return this.storyItemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storyItemService.findOne(id);
  }

  @Get(':storyId')
  findByStoryId(@Param('storyId') storyId: string) {
    return this.storyItemService.findByStoryId(storyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStoryItemDto: UpdateStoryItemDto,
  ) {
    return this.storyItemService.update(id, updateStoryItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.storyItemService.remove(id);
  }
}
