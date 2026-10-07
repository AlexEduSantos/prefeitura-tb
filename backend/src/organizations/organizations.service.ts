import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { getAllDescendantOrgIds } from '../common/utils/organization-hierarchy.util';

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
    return this.prisma.organization.findMany({
      where: includeInactive ? undefined : { active: true },
      include: {
        parent: true,
        children: true,
        defaultSpace: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findTree() {
    // Retorna as organizações de nível raiz com seus filhos recursivos
    return this.prisma.organization.findMany({
      where: { parentId: null, active: true },
      include: {
        defaultSpace: true,
        children: {
          include: {
            defaultSpace: true,
            children: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
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

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    await this.findOne(id);
    return this.prisma.organization.update({
      where: { id },
      data: updateOrganizationDto,
      include: {
        parent: true,
        defaultSpace: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.organization.update({
      where: { id },
      data: { active: false },
    });
  }
}
