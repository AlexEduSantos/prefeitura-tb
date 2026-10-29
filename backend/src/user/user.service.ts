import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: createUserDto,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        phone: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        password: false,
        organizationId: true,
        organization: {
          select: {
            title: true,
          },
        },
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        phone: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        organizationId: true,
        // O password já fica de fora automaticamente porque você não colocou true

        // ✅ Usando select aninhado para a organização no lugar do include
        organization: {
          select: {
            title: true,
          },
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        phone: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        password: false,
        organizationId: true,
        organization: {
          select: {
            title: true,
          },
        },
      },
    });
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        phone: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        password: false,
        organizationId: true,
        organization: {
          select: {
            title: true,
          },
        },
      },
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
