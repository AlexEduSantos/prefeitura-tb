import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-services.dto';
import { UpdateServiceDto } from './dto/update-serviecs.dto';
import { UserRole } from '../generated/prisma/enums';
import { ApprovalService } from '../approval/approval.service';

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private approvalService?: ApprovalService,
  ) {}

  private get approval(): ApprovalService {
    if (!this.approvalService) {
      this.approvalService = new ApprovalService(this.prisma);
    }
    return this.approvalService;
  }

  async create(
    createServiceDto: CreateServiceDto,
    userId: string,
    userRole?: UserRole,
  ): Promise<any> {
    if (userRole === UserRole.USER) {
      const req = await this.approval.submitChangeRequest({
        entityType: 'Service',
        entityId: null,
        requestType: 'create',
        proposedData: {
          ...createServiceDto,
          active: true,
          userId,
        },
        requestedById: userId,
      });

      return {
        id: req.id,
        ...createServiceDto,
        active: false,
        userId,
        workflowStatus: 'pendente',
        changeRequestId: req.id,
        pendingRequest: req,
      };
    }

    return this.prisma.services.create({
      data: {
        ...createServiceDto,
        active: true,
        userId,
      },
    });
  }

  async findAll(): Promise<any[]> {
    const services = await this.prisma.services.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        organization: true,
        image: true,
        user: { select: { name: true, avatar: true } },
      },
    });
    return this.approval.attachWorkflowMeta('Service', services);
  }

  async findAllPublic(page?: string, limit?: string, title?: string) {
    const parsedPage = Math.max(1, parseInt(page as string, 10) || 1);
    const parsedLimit = Math.min(
      100,
      Math.max(1, parseInt(limit as string, 10) || 10),
    );
    const skip = (parsedPage - 1) * parsedLimit;

    const where: any = {
      active: true,
      deletedAt: null,
    };
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

  async findOne(id: string): Promise<any> {
    const service = await this.prisma.services.findUnique({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Serviço com ID ${id} não encontrado.`);
    }
    return this.approval.attachWorkflowMetaOne('Service', service);
  }

  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
    userId?: string,
    userRole?: UserRole,
  ): Promise<any> {
    if (userRole === UserRole.USER) {
      const current = await this.findOne(id);
      const req = await this.approval.submitChangeRequest({
        entityType: 'Service',
        entityId: id,
        requestType: 'update',
        proposedData: { ...updateServiceDto },
        requestedById: userId || current.userId,
      });
      return {
        ...current,
        workflowStatus: 'pendente',
        changeRequestId: req.id,
        pendingRequest: req,
      };
    }

    return this.prisma.services.update({
      where: { id },
      data: { ...updateServiceDto },
    });
  }

  async remove(
    id: string,
    userRole?: UserRole,
    hardDelete = false,
    userId?: string,
  ): Promise<any> {
    if (userRole === UserRole.USER) {
      const current = await this.findOne(id);
      const req = await this.approval.submitChangeRequest({
        entityType: 'Service',
        entityId: id,
        requestType: 'delete',
        proposedData: { title: current.title, link: current.link },
        requestedById: userId || current.userId,
      });
      return {
        ...current,
        workflowStatus: 'pendente',
        changeRequestId: req.id,
        pendingRequest: req,
      };
    }

    if (userRole === UserRole.ADMIN && hardDelete) {
      return this.prisma.services.delete({ where: { id } });
    }

    return this.prisma.services.update({
      where: { id },
      data: {
        active: false,
        deletedAt: new Date(),
      },
    });
  }

  async approve(
    id: string,
    approverId?: string,
    proposedData?: Record<string, any>,
  ): Promise<any> {
    return this.approval.approveByEntityOrRequestId(
      'Service',
      id,
      approverId,
      proposedData,
    );
  }

  async reject(id: string, approverId?: string, reason?: string): Promise<any> {
    return this.approval.rejectByEntityOrRequestId(
      'Service',
      id,
      approverId,
      reason,
    );
  }
}
