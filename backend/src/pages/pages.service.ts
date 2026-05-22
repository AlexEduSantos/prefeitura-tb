import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { Page } from '@prisma/client';

@Injectable()
export class PagesService {
  constructor(private prisma: PrismaService) {}

  async create(createPageDto: CreatePageDto): Promise<Page> {
    return this.prisma.page.create({
      data: createPageDto,
    });
  }

  async findAll(): Promise<Page[]> {
    return this.prisma.page.findMany({
      include: { entity: true },
    });
  }

  async findOne(id: string): Promise<Page> {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: { entity: true },
    });
    if (!page) {
      throw new NotFoundException(`Página com ID ${id} não encontrada.`);
    }
    return page;
  }

  async update(id: string, updatePageDto: UpdatePageDto): Promise<Page> {
    return this.prisma.page.update({
      where: { id },
      data: updatePageDto,
    });
  }

  async remove(id: string): Promise<Page> {
    return this.prisma.page.delete({
      where: { id },
    });
  }
}
