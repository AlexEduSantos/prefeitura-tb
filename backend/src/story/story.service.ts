import { Injectable } from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoryService {
  constructor(private prisma: PrismaService) {}

  async create(createStoryDto: CreateStoryDto, userId: string) {
    return this.prisma.stories.create({
      data: createStoryDto,
    });
  }

  async findAll() {
    return this.prisma.stories.findMany({
      include: {
        cover: {
          select: {
            key: true,
            altText: true,
          },
        },
        items: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.stories.findUnique({
      where: { id },
      include: {
        cover: {
          select: {
            key: true,
            altText: true,
          },
        },
        items: true,
      },
    });
  }

  update(id: string, updateStoryDto: UpdateStoryDto) {
    return this.prisma.stories.update({
      where: { id },
      data: updateStoryDto,
    });
  }

  remove(id: string) {
    return this.prisma.stories.delete({
      where: { id },
    });
  }
}
