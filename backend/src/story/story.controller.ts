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
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  ParseEnumPipe,
  BadRequestException,
  ForbiddenException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { StoryService } from './story.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { SessionGuard } from '../auth/session.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { Action } from '../casl/action.enum';
import { UserRole } from '../generated/prisma/enums';
import { CreateStoryItemDto } from './dto/create-story-item.dto';
import { UpdateStoryItemDto } from './dto/update-story-item.dto';

@Controller('story')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @UseGuards(SessionGuard, PoliciesGuard)
  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'Stories'))
  async create(@Body() createStoryDto: CreateStoryDto, @Request() req: any) {
    const user = req.user;
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para criar destaques.',
      );
    }
    return this.storyService.create(createStoryDto);
  }

  @Get()
  async findAllStories(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder', new ParseEnumPipe(['asc', 'desc'], { optional: true }))
    sortOrder?: 'asc' | 'desc',
    @Query('title', new DefaultValuePipe('')) title?: string,
  ) {
    const allowedSortFields = ['title', 'createdAt', 'updatedAt'];
    if (sortBy && !allowedSortFields.includes(sortBy)) {
      throw new BadRequestException(`Invalid sort field: ${sortBy}`);
    }

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));

    return this.storyService.findAll({
      page: safePage,
      limit: safeLimit,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      title,
    });
  }

  @Get('items')
  async findAllStoryItems() {
    return this.storyService.findAllStoryItems();
  }

  @Get('items/:id')
  async findStoryItemById(@Param('id', ParseUUIDPipe) id: string) {
    return this.storyService.findStoryItemById(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storyService.findOne(id);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch(':id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'Stories'))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStoryDto: UpdateStoryDto,
    @Request() req: any,
  ) {
    const user = req.user;
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para editar destaques.',
      );
    }
    return this.storyService.update(id, updateStoryDto);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Delete(':id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'Stories'))
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    const user = req.user;
    await this.storyService.findOne(id);
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir este destaque',
      );
    }
    return this.storyService.remove(id);
  }

  // ----- Story Item -----

  @UseGuards(SessionGuard, PoliciesGuard)
  @Post(':storyId/item')
  @CheckPolicies((ability) => ability.can(Action.Create, 'StoryItem'))
  async createStoryItem(
    @Param('storyId', ParseUUIDPipe) storyId: string,
    @Body() createStoryItemDto: CreateStoryItemDto,
    @Request() req: any,
  ) {
    const user = req.user;
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para criar itens de destaques.',
      );
    }
    return this.storyService.createStoryItem(createStoryItemDto, storyId);
  }

  @Get(':storyId/items')
  async findAllStoryItemsByStoryId(
    @Param('storyId', ParseUUIDPipe) storyId: string,
  ) {
    return this.storyService.findAllStoryItemsByStoryId(storyId);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch('items/order')
  @CheckPolicies((ability) => ability.can(Action.Update, 'StoryItem'))
  async updateStoryItemOrder(@Body('ids') ids: string[], @Request() req: any) {
    const user = req.user;
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para editar a ordem dos itens de destaque.',
      );
    }
    return this.storyService.updateOrderStoryItems(ids);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Patch('items/:id')
  @CheckPolicies((ability) => ability.can(Action.Update, 'StoryItem'))
  async updateStoryItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStoryItemDto: UpdateStoryItemDto,
    @Request() req: any,
  ) {
    const user = req.user;
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para editar itens de destaque.',
      );
    }
    return this.storyService.updateStoryItem(id, updateStoryItemDto);
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Delete('items/:id')
  @CheckPolicies((ability) => ability.can(Action.Delete, 'StoryItem'))
  async removeStoryItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ) {
    const user = req.user;
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir itens de destaque.',
      );
    }
    return this.storyService.removeStoryItem(id);
  }
}
