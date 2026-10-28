import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-services.dto';
import { UpdateServiceDto } from './dto/update-serviecs.dto';
import { Services } from '../generated/prisma/client';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  create(createServiceDto: CreateServiceDto, userId: string) {
    return this.prisma.services.create({
      data: { ...createServiceDto, userId },
    });
  }

  findAll(): Promise<Services[]> {
    return this.prisma.services.findMany({
      include: {
        organization: true,
        image: true,
        user: { select: { name: true, avatar: true } },
      },
    });
  }

  async findAllPublic(page?: string, limit?: string, title?: string) {
    const parsedPage = Math.max(1, parseInt(page as string, 10) || 1);
    const parsedLimit = Math.max(1, parseInt(limit as string, 10) || 10);
    const skip = (parsedPage - 1) * parsedLimit;

    const where: any = {};
    if (title && title.trim() !== '') {
      where.title = {
        contains: title.trim(),
        mode: 'insensitive',
      };
    }

    const [services, total] = await Promise.all([
      this.prisma.services.findMany({
        where,
        skip,
        take: parsedLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          organization: true,
          image: true,
          user: { select: { name: true, avatar: true } },
        },
      }),
      this.prisma.services.count({
        where,
      }),
    ]);

    return {
      services,
      meta: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit),
      },
    };
  }

  findOne(id: string) {
    return this.prisma.services.findUnique({ where: { id } });
  }

  update(id: string, updateServiceDto: UpdateServiceDto, userId: string) {
    return this.prisma.services.update({
      where: { id },
      data: { ...updateServiceDto, userId },
    });
  }

  remove(id: string) {
    return this.prisma.services.delete({ where: { id } });
  }
}
