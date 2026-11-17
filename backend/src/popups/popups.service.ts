import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePopupDto } from './dto/create-popup.dto';
import { UpdatePopupDto } from './dto/update-popup.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Popups } from '../generated/prisma/client';

@Injectable()
export class PopupsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createPopupDto: CreatePopupDto,
    userId: string,
  ): Promise<Popups> {
    const {
      title,
      imageId,
      link,
      active,
      displayTime,
      status,
      type,
      position,
      closeButton,
      priority,
      publicationDate,
      expirationDate,
      organizationId,
      spaceId,
    } = createPopupDto;

    const data: any = {
      title,
      imageId,
      userId,
      ...(link !== undefined && { link }),
      ...(active !== undefined && { active }),
      ...(displayTime !== undefined && { displayTime }),
      ...(status !== undefined && { status }),
      ...(type !== undefined && { type }),
      ...(position !== undefined && { position }),
      ...(closeButton !== undefined && { closeButton }),
      ...(priority !== undefined && { priority }),
      ...(organizationId !== undefined && {
        organizationId: organizationId || null,
      }),
      ...(spaceId !== undefined && { spaceId: spaceId || null }),
    };

    if (publicationDate) {
      data.publicationDate = new Date(publicationDate);
    }
    if (expirationDate) {
      data.expirationDate = new Date(expirationDate);
    }

    return this.prisma.popups.create({
      data,
    });
  }

  async findAll(): Promise<Popups[]> {
    return this.prisma.popups.findMany({
      include: {
        organization: true,
        space: true,
        image: true,
        user: { select: { name: true, avatar: true } },
      },
    });
  }

  async findOne(id: string): Promise<Popups> {
    const popup = await this.prisma.popups.findUnique({
      where: { id },
      include: {
        organization: true,
        space: true,
        image: true,
        user: { select: { name: true, avatar: true } },
      },
    });
    if (!popup) {
      throw new NotFoundException(`Popup com ID ${id} não encontrado.`);
    }
    return popup;
  }

  async update(id: string, updatePopupDto: UpdatePopupDto): Promise<Popups> {
    const {
      title,
      link,
      active,
      displayTime,
      status,
      type,
      position,
      closeButton,
      priority,
      publicationDate,
      expirationDate,
      imageId,
      organizationId,
      spaceId,
      userId,
    } = updatePopupDto as any;

    const data: any = {};

    if (title !== undefined) data.title = title;
    if (link !== undefined) data.link = link;
    if (active !== undefined) data.active = active;
    if (displayTime !== undefined) data.displayTime = displayTime;
    if (status !== undefined) data.status = status;
    if (type !== undefined) data.type = type;
    if (position !== undefined) data.position = position;
    if (closeButton !== undefined) data.closeButton = closeButton;
    if (priority !== undefined) data.priority = priority;
    if (publicationDate !== undefined)
      data.publicationDate = new Date(publicationDate);
    if (expirationDate !== undefined)
      data.expirationDate = new Date(expirationDate);
    if (imageId !== undefined) data.imageId = imageId;
    if (organizationId !== undefined) data.organizationId = organizationId;
    if (spaceId !== undefined) data.spaceId = spaceId;
    if (userId !== undefined) data.userId = userId;

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
