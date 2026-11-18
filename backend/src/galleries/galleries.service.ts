import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGalleriesDto } from './dto/create-galleries.dto';
import { UpdateGalleriesDto } from './dto/update-galleries.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Galleries } from '../generated/prisma/client';

@Injectable()
export class GalleriesService {
  constructor(private prisma: PrismaService) {}

  async create(
    createGalleriesDto: CreateGalleriesDto,
    userId: string,
  ): Promise<Galleries> {
    const { slides, ...galleryData } = createGalleriesDto;
    return this.prisma.galleries.create({
      data: {
        ...galleryData,
        userId,
        slides: slides
          ? {
              create: slides.map((slide) => ({
                order: slide.order,
                caption: slide.caption,
                link: slide.link,
                media: { connect: { id: slide.mediaId } },
              })),
            }
          : undefined,
      },
    });
  }

  async findAll(): Promise<Galleries[]> {
    return this.prisma.galleries.findMany({
      include: {
        organization: true,
        space: true,
        slides: { include: { media: true }, orderBy: { order: 'asc' } },
        user: { select: { name: true, avatar: true } },
      },
    });
  }

  async findOne(id: string): Promise<Galleries> {
    const galleries = await this.prisma.galleries.findUnique({
      where: { id },
      include: {
        organization: true,
        space: true,
        slides: { include: { media: true }, orderBy: { order: 'asc' } },
        user: { select: { name: true, avatar: true } },
      },
    });
    if (!galleries) {
      throw new NotFoundException(`Galeria com ID ${id} não encontrado.`);
    }
    return galleries;
  }

  async update(
    id: string,
    updateGalleriesDto: UpdateGalleriesDto,
  ): Promise<Galleries> {
    const { slides, ...galleryData } = updateGalleriesDto;

    if (slides) {
      return this.prisma.$transaction(async (prisma) => {
        await prisma.galleryMedia.deleteMany({
          where: { galleryId: id },
        });

        return prisma.galleries.update({
          where: { id },
          data: {
            ...galleryData,
            slides: {
              create: slides.map((slide) => ({
                order: slide.order,
                caption: slide.caption,
                link: slide.link,
                media: { connect: { id: slide.mediaId } },
              })),
            },
          },
        });
      });
    }

    return this.prisma.galleries.update({
      where: { id },
      data: galleryData,
    });
  }

  async remove(id: string): Promise<Galleries> {
    return this.prisma.galleries.delete({
      where: { id },
    });
  }
}
