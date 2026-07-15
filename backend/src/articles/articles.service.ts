import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
      },
    });

    // Buscar todas as imagens relacionadas em uma única query
    const coverIds = articles.map((a) => a.cover).filter(Boolean) as string[];
    const galleryIds = articles.flatMap((a) => a.galleryImages).filter(Boolean);
    const allMediaIds = [...new Set([...coverIds, ...galleryIds])];

    const medias = await this.prisma.media.findMany({
      where: { id: { in: allMediaIds } },
    });

    const mediaMap = new Map(medias.map((m) => [m.id, m]));

    // Enriquecer os artigos com os dados das imagens
    return articles.map((article) => ({
      ...article,
      coverData: article.cover ? mediaMap.get(article.cover) : null,
      galleryData: article.galleryImages
        .map((id) => mediaMap.get(id))
        .filter(Boolean),
    }));
  }

  async findOne(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { entity: true },
    });

    if (!article) {
      throw new NotFoundException(`Artigo com ID ${id} não encontrado.`);
    }

    const coverId = article.cover;
    const galleryIds = article.galleryImages;
    const allMediaIds = [...new Set([...coverId!, ...galleryIds])];
    const medias = await this.prisma.media.findMany({
      where: { id: { in: allMediaIds } },
    });
    const mediaMap = new Map(medias.map((m) => [m.id, m]));

    return {
      ...article,
      coverData: article.cover ? mediaMap.get(article.cover)! : null,
      galleryData: article.galleryImages
        .map((id) => mediaMap.get(id))
        .filter(Boolean),
    };
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
