import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Article } from '../generated/prisma/client';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  async create(createArticleDto: CreateArticleDto): Promise<Article> {
    return this.prisma.article.create({
      data: {
        ...createArticleDto,
        publicationDate: createArticleDto.publicationDate
          ? new Date(createArticleDto.publicationDate)
          : null,
        expirationDate: createArticleDto.expirationDate
          ? new Date(createArticleDto.expirationDate)
          : null,
      },
    });
  }

  async findAll() {
    const articles = await this.prisma.article.findMany({
      include: {
        entity: true,
        cover: true,
        author: true,
        editor: true,
        gallery: {
          include: {
            slides: {
              orderBy: { order: 'asc' }, // Garante que as fotos venham na ordem definida
              include: {
                media: true, // Traz os dados reais da imagem (url, altText, etc.)
              },
            },
          },
        },
      },
    });

    if (!articles) {
      throw new NotFoundException(`Artigos não encontrados.`);
    }

    return articles;
  }

  async findOne(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        entity: true,
        cover: true,
        author: true,
        editor: true,
        gallery: {
          include: {
            slides: {
              orderBy: { order: 'asc' }, // Garante que as fotos venham na ordem definida
              include: {
                media: true, // Traz os dados reais da imagem (url, altText, etc.)
              },
            },
          },
        },
      },
    });

    if (!article) {
      throw new NotFoundException(`Artigo com ID ${id} não encontrado.`);
    }

    return article;
  }

  async update(
    id: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<Article> {
    const formattedData: any = { ...updateArticleDto };
    if (updateArticleDto.publicationDate) {
      formattedData.publicationDate = new Date(
        updateArticleDto.publicationDate,
      );
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
