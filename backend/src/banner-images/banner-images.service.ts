import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBannerImageDto } from './dto/create-banner-image.dto';
import { UpdateBannerImageDto } from './dto/update-banner-image.dto';
import { PrismaService } from '../prisma/prisma.service';
import { BannerImage } from '@prisma/client';

@Injectable()
export class BannerImagesService {
  constructor(private prisma: PrismaService) {}

  async create(createBannerImageDto: CreateBannerImageDto): Promise<BannerImage> {
    return this.prisma.bannerImage.create({
      data: createBannerImageDto,
    });
  }

  async findAll(): Promise<BannerImage[]> {
    return this.prisma.bannerImage.findMany({
      include: { banner: true, media: true },
    });
  }

  async findOne(id: string): Promise<BannerImage> {
    const bannerImage = await this.prisma.bannerImage.findUnique({
      where: { id },
      include: { banner: true, media: true },
    });
    if (!bannerImage) {
      throw new NotFoundException(`BannerImage com ID ${id} não encontrado.`);
    }
    return bannerImage;
  }

  async update(id: string, updateBannerImageDto: UpdateBannerImageDto): Promise<BannerImage> {
    return this.prisma.bannerImage.update({
      where: { id },
      data: updateBannerImageDto,
    });
  }

  async remove(id: string): Promise<BannerImage> {
    return this.prisma.bannerImage.delete({
      where: { id },
    });
  }
}
