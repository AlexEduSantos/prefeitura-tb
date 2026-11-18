import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';

const DEFAULT_ACTIVATION_TTL_HOURS = 24;

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly mailService?: MailService,
  ) {}

  private generateActivationTokenData() {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const ttlHours =
      Number(process.env.ACTIVATION_TOKEN_TTL_HOURS) ||
      DEFAULT_ACTIVATION_TTL_HOURS;
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    return {
      rawToken,
      tokenHash,
      expiresAt,
      maxUses: 1,
      usedCount: 0,
    };
  }

  async create(createUserDto: CreateUserDto) {
    const {
      name,
      username,
      email,
      password,
      avatar,
      phone,
      organizationId,
      role,
    } = createUserDto;

    const rawPassword =
      password && password.trim().length > 0
        ? password
        : randomBytes(24).toString('hex');
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const activation = this.generateActivationTokenData();

    const createdUser = await this.prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        ...(avatar !== undefined && { avatar }),
        ...(phone !== undefined && { phone }),
        // Conta criada pelo ADMIN aguarda definição de senha via link de ativação
        active: false,
        activationTokenHash: activation.tokenHash,
        activationTokenExpiresAt: activation.expiresAt,
        activationTokenMaxUses: activation.maxUses,
        activationTokenUsedCount: activation.usedCount,
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
        activationTokenHash: false,
        organizationId: true,
        organization: {
          select: {
            title: true,
          },
        },
      },
    });

    if (this.mailService) {
      await this.mailService.sendAccountActivationEmail({
        to: email,
        name,
        token: activation.rawToken,
        expiresAt: activation.expiresAt,
      });
    }

    return createdUser;
  }

  async resendActivationLink(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const activation = this.generateActivationTokenData();

    await this.prisma.user.update({
      where: { id },
      data: {
        active: false,
        activationTokenHash: activation.tokenHash,
        activationTokenExpiresAt: activation.expiresAt,
        activationTokenMaxUses: activation.maxUses,
        activationTokenUsedCount: activation.usedCount,
      },
    });

    if (this.mailService) {
      await this.mailService.sendAccountActivationEmail({
        to: user.email,
        name: user.name,
        token: activation.rawToken,
        expiresAt: activation.expiresAt,
      });
    }

    return {
      message: 'Novo link de ativação enviado para o e-mail do usuário.',
      expiresAt: activation.expiresAt,
    };
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
