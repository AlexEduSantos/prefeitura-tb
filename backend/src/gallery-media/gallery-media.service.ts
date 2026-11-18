import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateGalleryMediaDto } from './dto/create-gallery-media.dto';
import { UpdateGalleryMediaDto } from './dto/update-gallery-media.dto';
import { PrismaService } from '../prisma/prisma.service';
import { GalleryMedia } from '../generated/prisma/client';

@Injectable()
export class GalleryMediaService {
  constructor(private prisma: PrismaService) {}

  async create(
    createGalleryMediaDto: CreateGalleryMediaDto,
  ): Promise<GalleryMedia> {
    const { bannerId, galleryId, mediaId, order, caption, link } =
      createGalleryMediaDto;
    const resolvedGalleryId = galleryId || bannerId;
    if (!resolvedGalleryId) {
      throw new BadRequestException('galleryId is required');
    }
    return this.prisma.galleryMedia.create({
      data: {
        galleryId: resolvedGalleryId,
        mediaId,
        ...(order !== undefined && { order }),
        ...(caption !== undefined && { caption }),
        ...(link !== undefined && { link }),
      },
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
