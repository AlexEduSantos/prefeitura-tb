import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';
import { Entity } from '../generated/prisma/client';

@Injectable()
export class EntitiesService {
  constructor(private prisma: PrismaService) {}

  async create(createEntityDto: CreateEntityDto): Promise<Entity> {
    return this.prisma.entity.create({
      data: createEntityDto,
    });
  }

  async findAll(): Promise<Entity[]> {
    return this.prisma.entity.findMany({
      include: {
        pages: true,
        articles: true,
      },
    });
  }

  async findOne(id: string): Promise<Entity> {
    const entity = await this.prisma.entity.findUnique({
      where: { id },
      include: {
        pages: true,
        articles: true,
      },
    });
    if (!entity) {
      throw new NotFoundException(`Secretaria com ID ${id} não encontrada.`);
    }
    return entity;
  }

  async update(id: string, updateEntityDto: UpdateEntityDto): Promise<Entity> {
    return this.prisma.entity.update({
      where: { id },
      data: updateEntityDto,
    });
  }

  async remove(id: string): Promise<Entity> {
    return this.prisma.entity.delete({
      where: { id },
    });
  }
}
