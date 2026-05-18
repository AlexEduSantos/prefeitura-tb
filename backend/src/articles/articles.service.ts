import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article } from '@prisma/client';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  async create(createArticleDto: CreateArticleDto): Promise<Article> {
    return this.prisma.article.create({
      data: {
        ...createArticleDto,
        publicationDate: createArticleDto.publicationDate ? new Date(createArticleDto.publicationDate) : null,
        expirationDate: createArticleDto.expirationDate ? new Date(createArticleDto.expirationDate) : null,
      },
    });
  }

  async findAll(): Promise<Article[]> {
    return this.prisma.article.findMany({
      include: { entity: true },
    });
  }

  async findOne(id: string): Promise<Article> {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { entity: true },
    });
    if (!article) {
      throw new NotFoundException(`Artigo com ID ${id} não encontrado.`);
    }
    return article;
  }

  async update(id: string, updateArticleDto: UpdateArticleDto): Promise<Article> {
    const formattedData: any = { ...updateArticleDto };
    if (updateArticleDto.publicationDate) {
      formattedData.publicationDate = new Date(updateArticleDto.publicationDate);
    }
    if (updateArticleDto.expirationDate) {
      formattedData.expirationDate = new Date(updateArticleDto.expirationDate);
    }

    return this.prisma.article.update({
      where: { id },
      data: formattedData,
    });
  }

  async remove(id: string): Promise<Article> {
    return this.prisma.article.delete({
      where: { id },
    });
  }
}
