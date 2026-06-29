import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePopupDto } from './dto/create-popup.dto';
import { UpdatePopupDto } from './dto/update-popup.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Popups } from '@prisma/client';

@Injectable()
export class PopupsService {
  constructor(private prisma: PrismaService) {}

  async create(createPopupDto: CreatePopupDto, userId: string): Promise<Popups> {
    const data: any = {
      ...createPopupDto,
      userId,
    };
    if (createPopupDto.publicationDate) {
      data.publicationDate = new Date(createPopupDto.publicationDate);
    }
    if (createPopupDto.expirationDate) {
      data.expirationDate = new Date(createPopupDto.expirationDate);
    }

    return this.prisma.popups.create({
      data,
    });
  }

  async findAll(): Promise<Popups[]> {
    return this.prisma.popups.findMany({
      include: { entity: true, image: true },
    });
  }

  async findOne(id: string): Promise<Popups> {
    const popup = await this.prisma.popups.findUnique({
      where: { id },
      include: { entity: true, image: true },
    });
    if (!popup) {
      throw new NotFoundException(`Popup com ID ${id} não encontrado.`);
    }
    return popup;
  }

  async update(id: string, updatePopupDto: UpdatePopupDto): Promise<Popups> {
    const data: any = { ...updatePopupDto };
    if (updatePopupDto.publicationDate) {
      data.publicationDate = new Date(updatePopupDto.publicationDate);
    }
    if (updatePopupDto.expirationDate) {
      data.expirationDate = new Date(updatePopupDto.expirationDate);
    }

    return this.prisma.popups.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<Popups> {
    return this.prisma.popups.delete({
      where: { id },
    });
  }
}
