import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const {
      name,
      username,
      email,
      password,
      avatar,
      phone,
      active,
      organizationId,
      role,
    } = createUserDto;

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        ...(avatar !== undefined && { avatar }),
        ...(phone !== undefined && { phone }),
        ...(active !== undefined && { active }),
        ...(organizationId !== undefined && {
          organizationId: organizationId || null,
        }),
        role,
      },
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

  async update(id: string, updateUserDto: UpdateUserDto) {
    const {
      name,
      username,
      email,
      password,
      avatar,
      phone,
      active,
      organizationId,
      role,
    } = updateUserDto;

    const data: Record<string, any> = {};
    if (name !== undefined) data.name = name;
    if (username !== undefined) data.username = username;
    if (email !== undefined) data.email = email;
    if (password !== undefined && password !== '') {
      data.password = await bcrypt.hash(password, 10);
    }
    if (avatar !== undefined) data.avatar = avatar;
    if (phone !== undefined) data.phone = phone;
    if (active !== undefined) data.active = active;
    if (organizationId !== undefined) {
      data.organizationId = organizationId || null;
    }
    if (role !== undefined) data.role = role;

    return this.prisma.user.update({
      where: { id },
      data,
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
