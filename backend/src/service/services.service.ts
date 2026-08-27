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
        entity: true,
        image: true,
        user: { select: { name: true, avatar: true } },
      },
    });
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
