import { Injectable } from '@nestjs/common';
import { CreateStoryItemDto } from './dto/create-story-item.dto';
import { UpdateStoryItemDto } from './dto/update-story-item.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoryItemService {
  constructor(private prisma: PrismaService) {}

  async create(createStoryItemDto: CreateStoryItemDto) {
    const { storyId, mediaId, ...data } = createStoryItemDto;
    const lastStoryItem = await this.prisma.storiesItem.findFirst({
      where: { storyId },
      orderBy: { order: 'desc' },
    });

    const order = lastStoryItem ? lastStoryItem.order + 1 : 0;

    return this.prisma.storiesItem.create({
      data: {
        ...data,
        storyId,
        mediaId,
        order,
      },
    });
  }

  async findAll() {
    return this.prisma.storiesItem.findMany({
      include: {
        media: {
          select: {
            key: true,
            altText: true,
          },
        },
        story: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.storiesItem.findUnique({
      where: { id },
      include: {
        media: {
          select: {
            key: true,
            altText: true,
          },
        },
        story: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async findByStoryId(storyId: string) {
    return this.prisma.storiesItem.findMany({
      where: { storyId },
      include: {
        media: {
          select: {
            key: true,
            altText: true,
          },
        },
        story: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async update(id: string, updateStoryItemDto: UpdateStoryItemDto) {
    return this.prisma.storiesItem.update({
      where: { id },
      data: updateStoryItemDto,
    });
  }

  async updateOrder(id: string, order: number) {
    return this.prisma.storiesItem.update({
      where: { id },
      data: { order },
    });
  }

  async remove(id: string) {
    return this.prisma.storiesItem.delete({
      where: { id },
    });
  }
}
