import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGalleryMediaDto } from './dto/create-gallery-media.dto';
import { UpdateGalleryMediaDto } from './dto/update-gallery-media.dto';
import { PrismaService } from '../prisma/prisma.service';
import { GalleryMedia } from '@prisma/client';

@Injectable()
export class GalleryMediaService {
  constructor(private prisma: PrismaService) {}

  async create(
    CreateGalleryMediaDto: CreateGalleryMediaDto,
  ): Promise<GalleryMedia> {
    if (!CreateGalleryMediaDto.bannerId) {
      throw new Error('bannerId is required');
    }
    return this.prisma.galleryMedia.create({
      data: CreateGalleryMediaDto as any,
    });
  }

  async findAll(): Promise<GalleryMedia[]> {
    return this.prisma.galleryMedia.findMany({
      include: { gallery: true, media: true },
    });
  }

  async findOne(id: string): Promise<GalleryMedia> {
    const GalleryMedia = await this.prisma.galleryMedia.findUnique({
      where: { id },
      include: { gallery: true, media: true },
    });
    if (!GalleryMedia) {
      throw new NotFoundException(`GalleryMedia com ID ${id} não encontrado.`);
    }
    return GalleryMedia;
  }

  async update(
    id: string,
    updateGalleryMediaDto: UpdateGalleryMediaDto,
  ): Promise<GalleryMedia> {
    return this.prisma.galleryMedia.update({
      where: { id },
      data: updateGalleryMediaDto,
    });
  }

  async remove(id: string): Promise<GalleryMedia> {
    return this.prisma.galleryMedia.delete({
      where: { id },
    });
  }
}
