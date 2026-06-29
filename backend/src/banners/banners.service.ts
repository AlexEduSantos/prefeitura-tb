import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Banners } from '@prisma/client';

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) {}

  async create(createBannerDto: CreateBannerDto, userId: string): Promise<Banners> {
    return this.prisma.banners.create({
      data: {
        ...createBannerDto,
        userId,
      },
    });
  }

  async findAll(): Promise<Banners[]> {
    return this.prisma.banners.findMany({
      include: { entity: true, slides: true },
    });
  }

  async findOne(id: string): Promise<Banners> {
    const banner = await this.prisma.banners.findUnique({
      where: { id },
      include: { entity: true, slides: true },
    });
    if (!banner) {
      throw new NotFoundException(`Banner com ID ${id} não encontrado.`);
    }
    return banner;
  }

  async update(id: string, updateBannerDto: UpdateBannerDto): Promise<Banners> {
    return this.prisma.banners.update({
      where: { id },
      data: updateBannerDto,
    });
  }

  async remove(id: string): Promise<Banners> {
    return this.prisma.banners.delete({
      where: { id },
    });
  }
}
