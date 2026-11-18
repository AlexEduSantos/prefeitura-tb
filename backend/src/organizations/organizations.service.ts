import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import {
  getAllAncestorOrgIds,
  getAllDescendantOrgIds,
} from '../common/utils/organization-hierarchy.util';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(createOrganizationDto: CreateOrganizationDto) {
    return this.prisma.organization.create({
      data: createOrganizationDto,
      include: {
        parent: true,
        defaultSpace: true,
      },
    });
  }

  async findAll(includeInactive = false) {
    // Leitura pública sempre força active: true
    const _ignore = includeInactive;
    return this.prisma.organization.findMany({
      where: { active: true },
      include: {
        parent: true,
        children: { where: { active: true } },
        defaultSpace: true,
      },
      orderBy: { title: 'asc' },
    });
  }

  async findAllAdmin(includeInactive = false) {
    return this.prisma.organization.findMany({
      where: includeInactive ? undefined : { active: true },
      include: {
        parent: true,
        children: true,
        defaultSpace: true,
      },
      orderBy: { title: 'asc' },
    });
  }

  async findTree(_includeInactive = 'active') {
    return this.prisma.organization.findMany({
      where: { parentId: null, active: true },
      include: {
        defaultSpace: true,
        children: {
          where: { active: true },
          include: {
            defaultSpace: true,
            children: {
              where: { active: true },
            },
          },
        },
      },
      orderBy: { title: 'asc' },
    });
  }

  async findTreeAdmin(includeInactive: string) {
    let onlyVisible: boolean | undefined = undefined;

    if (includeInactive === 'all') {
      return this.prisma.organization.findMany({
        where: { parentId: null },
        include: {
          defaultSpace: true,
          children: {
            include: {
              defaultSpace: true,
              children: true,
            },
          },
        },
        orderBy: { title: 'asc' },
      });
    } else if (includeInactive === 'active') {
      onlyVisible = true;
    } else if (includeInactive === 'inactive') {
      onlyVisible = false;
    }
    return this.prisma.organization.findMany({
      where: { parentId: null, active: onlyVisible },
      include: {
        defaultSpace: true,
        children: {
          where: { active: onlyVisible },
          include: {
            defaultSpace: true,
            children: {
              where: { active: onlyVisible },
            },
          },
        },
      },
      orderBy: { title: 'asc' },
    });
  }

  async findOne(id: string) {
    const org = await this.prisma.organization.findFirst({
      where: { id, active: true },
      include: {
        parent: true,
        children: { where: { active: true } },
        defaultSpace: true,
      },
    });
    if (!org) {
      throw new NotFoundException(`Organização com ID ${id} não encontrada.`);
    }
    return org;
  }

  async findOneAdmin(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        defaultSpace: true,
      },
    });
    if (!org) {
      throw new NotFoundException(`Organização com ID ${id} não encontrada.`);
    }
    return org;
  }

  async getDescendantIds(id: string): Promise<string[]> {
    return getAllDescendantOrgIds(this.prisma, id);
  }

  async getAncestorIds(id: string): Promise<string[]> {
    return getAllAncestorOrgIds(this.prisma, id);
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    await this.findOneAdmin(id);
    return this.prisma.organization.update({
      where: { id },
      data: updateOrganizationDto,
      include: {
        parent: true,
        defaultSpace: true,
      },
    });
  }

  async remove(id: string, userRole?: string, hardDelete = false) {
    await this.findOneAdmin(id);
    if (userRole === 'ADMIN' && hardDelete) {
      return this.prisma.organization.delete({
        where: { id },
      });
    }
    return this.prisma.organization.update({
      where: { id },
      data: { active: false },
    });
  }

  async activate(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: {
        id,
      },
      select: {
        active: true,
      },
    });

    if (!org) {
      throw new NotFoundException(`Organização com ID ${id} não encontrada.`);
    }

    return this.prisma.organization.update({
      where: { id },
      data: { active: !org.active },
    });
  }

  async changeParent(id: string, parentId: string | null) {
    const org = await this.prisma.organization.findUnique({
      where: {
        id,
      },
    });

    if (!org) {
      throw new NotFoundException(`Organização com ID ${id} não encontrada.`);
    }

    return this.prisma.organization.update({
      where: { id },
      data: { parentId },
    });
  }
}
