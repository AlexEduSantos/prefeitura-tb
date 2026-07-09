import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Banners } from '@prisma/client';

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) {}

  async create(
    createBannerDto: CreateBannerDto,
    userId: string,
  ): Promise<Banners> {
    const { slides, ...bannerData } = createBannerDto;
    return this.prisma.banners.create({
      data: {
        ...bannerData,
        userId,
        slides: slides
          ? {
              create: slides.map((slide) => ({
                ...slide,
              })),
            }
          : undefined,
      },
    });
  }

  async findAll(): Promise<Banners[]> {
    return this.prisma.banners.findMany({
      include: { entity: true, slides: { include: { media: true }, orderBy: { order: 'asc' } } },
    });
  }

  async findOne(id: string): Promise<Banners> {
    const banner = await this.prisma.banners.findUnique({
      where: { id },
      include: { entity: true, slides: { include: { media: true }, orderBy: { order: 'asc' } } },
    });
    if (!banner) {
      throw new NotFoundException(`Banner com ID ${id} não encontrado.`);
    }
    return banner;
  }

  async update(id: string, updateBannerDto: UpdateBannerDto): Promise<Banners> {
    const { slides, ...bannerData } = updateBannerDto;

    if (slides) {
      return this.prisma.$transaction(async (prisma) => {
        await prisma.bannerImage.deleteMany({
          where: { bannerId: id },
        });

        return prisma.banners.update({
          where: { id },
          data: {
            ...bannerData,
            slides: {
              create: slides.map((slide) => ({
                ...slide,
              })),
            },
          },
        });
      });
    }

    return this.prisma.banners.update({
      where: { id },
      data: bannerData,
    });
  }

  async remove(id: string): Promise<Banners> {
    return this.prisma.banners.delete({
      where: { id },
    });
  }
}
