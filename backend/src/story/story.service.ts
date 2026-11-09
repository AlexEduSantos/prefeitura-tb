import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoryItemDto } from './dto/create-story-item.dto';
import { UpdateStoryItemDto } from './dto/update-story-item.dto';
import { Prisma } from '../generated/prisma/client';

@Injectable()
export class StoryService {
  constructor(private prisma: PrismaService) {}

  // ----- Story -----

  async create(createStoryDto: CreateStoryDto) {
    const { items, ...storyData } = createStoryDto;

    // Preparar itens para criação aninhada
    const itemsToCreate = items?.map((item) => ({
      // Conecta à mídia existente
      media: { connect: { id: item.mediaId } },
      caption: item.caption,
      link: item.link,
      publishedDate: item.publishedDate ? new Date(item.publishedDate) : null,
      expirationDate: item.expirationDate
        ? new Date(item.expirationDate)
        : null,
      // order será definido automaticamente no createStoryItem ou pode ser passado
      order: item.order, // se fornecido, senão o Prisma pode usar padrão
    }));

    return this.prisma.stories.create({
      data: {
        ...storyData,
        items: itemsToCreate?.length ? { create: itemsToCreate } : undefined,
      },
      include: { items: true },
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    title?: string;
  }) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'asc',
      title,
    } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.StoriesWhereInput = {};
    if (title) where.title = { contains: title, mode: 'insensitive' };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.stories.findMany({
        where,
        include: {
          cover: {
            select: {
              key: true,
              altText: true,
            },
          },
          items: {
            where: {
              OR: [
                {
                  publishedDate: { lte: new Date() },
                  expirationDate: { gte: new Date() },
                },
                {
                  publishedDate: null,
                  expirationDate: null,
                },
              ],
            },
            orderBy: { order: 'asc' },
            include: {
              media: { select: { key: true, altText: true } },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.stories.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const story = await this.prisma.stories.findUnique({
      where: { id },
      include: {
        cover: {
          select: {
            key: true,
            altText: true,
          },
        },
        items: {
          where: {
            publishedDate: { lte: new Date() },
            expirationDate: { gte: new Date() },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!story) throw new NotFoundException('Destaque não encontrado');

    return story;
  }

  async update(id: string, updateStoryDto: UpdateStoryDto) {
    await this.findOne(id); // verifica existência
    const { items, ...storyData } = updateStoryDto;

    // Preparar itens para criação (caso sejam enviados novos)
    const itemsToCreate = items?.map((item) => ({
      media: { connect: { id: item.mediaId } },
      caption: item.caption,
      link: item.link,
      publishedDate: item.publishedDate ? new Date(item.publishedDate) : null,
      expirationDate: item.expirationDate
        ? new Date(item.expirationDate)
        : null,
      order: item.order,
    }));

    return this.prisma.stories.update({
      where: { id },
      data: {
        ...storyData,
        items: itemsToCreate?.length ? { create: itemsToCreate } : undefined,
      },
      include: { items: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.stories.delete({ where: { id } });
  }

  // ----- Story Item -----

  async createStoryItem(
    createStoryItemDto: CreateStoryItemDto,
    storyId: string,
  ) {
    // Verifica se o story existe
    await this.findOne(storyId);

    // Calcula a próxima ordem
    const count = await this.prisma.storiesItem.count({
      where: { storyId },
    });
    const order = count + 1;

    // Prepara os dados, convertendo datas
    const data = {
      storyId,
      order,
      caption: createStoryItemDto.caption,
      link: createStoryItemDto.link,
      mediaId: createStoryItemDto.mediaId,
      publishedDate: createStoryItemDto.publishedDate
        ? new Date(createStoryItemDto.publishedDate)
        : null,
      expirationDate: createStoryItemDto.expirationDate
        ? new Date(createStoryItemDto.expirationDate)
        : null,
    };

    return this.prisma.storiesItem.create({
      data,
      include: {
        story: { select: { id: true, title: true } },
        media: true,
      },
    });
  }

  async findAllStoryItems() {
    return this.prisma.storiesItem.findMany({
      include: {
        media: { select: { key: true, altText: true } },
        story: true,
      },
      orderBy: { order: 'asc' },
    });
  }

  async findAllStoryItemsByStoryId(storyId: string) {
    return this.prisma.storiesItem.findMany({
      where: {
        storyId,
        publishedDate: { lte: new Date() },
        expirationDate: { gte: new Date() },
      },
      include: {
        media: { select: { key: true, altText: true } },
        story: true,
      },
      orderBy: { order: 'asc' },
    });
  }

  async findStoryItemById(id: string) {
    const storyItem = await this.prisma.storiesItem.findUnique({
      where: { id },
      include: {
        media: { select: { key: true, altText: true } },
        story: true,
      },
    });
    if (!storyItem) throw new NotFoundException('Item do story não encontrado');
    return storyItem;
  }

  async updateStoryItem(id: string, updateStoryItemDto: UpdateStoryItemDto) {
    await this.findStoryItemById(id);

    // Prepara dados convertendo datas se presentes
    const data: any = {};
    if (updateStoryItemDto.caption !== undefined)
      data.caption = updateStoryItemDto.caption;
    if (updateStoryItemDto.link !== undefined)
      data.link = updateStoryItemDto.link;
    if (updateStoryItemDto.mediaId !== undefined)
      data.mediaId = updateStoryItemDto.mediaId;
    if (updateStoryItemDto.publishedDate !== undefined) {
      data.publishedDate = updateStoryItemDto.publishedDate
        ? new Date(updateStoryItemDto.publishedDate)
        : null;
    }
    if (updateStoryItemDto.expirationDate !== undefined) {
      data.expirationDate = updateStoryItemDto.expirationDate
        ? new Date(updateStoryItemDto.expirationDate)
        : null;
    }
    // order não deve ser atualizado aqui; use o endpoint específico

    return this.prisma.storiesItem.update({
      where: { id },
      data,
      include: {
        media: { select: { key: true, altText: true } },
        story: true,
      },
    });
  }

  async updateOrderStoryItems(ids: string[]) {
    // Verifica se todos os IDs existem
    const existingItems = await this.prisma.storiesItem.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });

    const existingIds = existingItems.map((item) => item.id);
    const missingIds = ids.filter((id) => !existingIds.includes(id));

    if (missingIds.length > 0) {
      throw new BadRequestException(
        `Items not found: ${missingIds.join(', ')}`,
      );
    }

    // Atualiza a ordem em uma transação
    const updatePromises = ids.map((id, index) =>
      this.prisma.storiesItem.update({
        where: { id },
        data: { order: index }, // ou index + 1 se preferir começar em 1
      }),
    );

    return this.prisma.$transaction(updatePromises);
  }

  async removeStoryItem(id: string) {
    await this.findStoryItemById(id);
    return this.prisma.storiesItem.delete({ where: { id } });
  }
}
