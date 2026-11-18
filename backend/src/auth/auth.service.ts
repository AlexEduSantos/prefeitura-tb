import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from '../prisma/prisma.service';

export const EXPIRED_OR_USED_ACTIVATION_LINK_MSG =
  'O link de ativação expirou ou já foi utilizado. Entre em contato com o Administrador para solicitar o envio de um novo link.';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  private hashActivationToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private sanitizeUser(user: Record<string, any>) {
    const safeUser = { ...user };
    delete safeUser.password;
    delete safeUser.activationTokenHash;
    return safeUser;
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(pass, user.password))) {
      return null;
    }

    if (!user.active) {
      throw new UnauthorizedException(
        'Sua conta ainda não foi ativada ou está desativada. Verifique o link de ativação enviado ao seu e-mail ou entre em contato com o Administrador.',
      );
    }

    return this.sanitizeUser(user);
  }

  async validateActivationToken(rawToken: string) {
    if (!rawToken || rawToken.trim().length === 0) {
      throw new BadRequestException(EXPIRED_OR_USED_ACTIVATION_LINK_MSG);
    }

    const tokenHash = this.hashActivationToken(rawToken.trim());
    const user = await this.prisma.user.findFirst({
      where: { activationTokenHash: tokenHash },
      select: {
        id: true,
        name: true,
        email: true,
        activationTokenExpiresAt: true,
        activationTokenMaxUses: true,
        activationTokenUsedCount: true,
      },
    });

    if (
      !user ||
      !user.activationTokenExpiresAt ||
      user.activationTokenExpiresAt.getTime() <= Date.now() ||
      user.activationTokenUsedCount >= user.activationTokenMaxUses
    ) {
      throw new BadRequestException(EXPIRED_OR_USED_ACTIVATION_LINK_MSG);
    }

    return {
      valid: true,
      email: user.email,
      name: user.name,
      expiresAt: user.activationTokenExpiresAt,
    };
  }

  async activateAccount(rawToken: string, newPassword: string) {
    if (!rawToken || rawToken.trim().length === 0) {
      throw new BadRequestException(EXPIRED_OR_USED_ACTIVATION_LINK_MSG);
    }

    const tokenHash = this.hashActivationToken(rawToken.trim());
    const user = await this.prisma.user.findFirst({
      where: { activationTokenHash: tokenHash },
      select: {
        id: true,
        activationTokenExpiresAt: true,
        activationTokenMaxUses: true,
        activationTokenUsedCount: true,
      },
    });

    const now = new Date();
    if (
      !user ||
      !user.activationTokenExpiresAt ||
      user.activationTokenExpiresAt.getTime() <= now.getTime() ||
      user.activationTokenUsedCount >= user.activationTokenMaxUses
    ) {
      throw new BadRequestException(EXPIRED_OR_USED_ACTIVATION_LINK_MSG);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updated = await this.prisma.user.updateMany({
      where: {
        id: user.id,
        activationTokenHash: tokenHash,
        activationTokenExpiresAt: { gt: now },
        activationTokenUsedCount: { lt: user.activationTokenMaxUses },
      },
      data: {
        password: hashedPassword,
        active: true,
        activationTokenUsedCount: { increment: 1 },
        activationTokenHash: null,
        activationTokenExpiresAt: null,
      },
    });

    if (updated.count === 0) {
      throw new BadRequestException(EXPIRED_OR_USED_ACTIVATION_LINK_MSG);
    }

    return {
      message: 'Conta ativada e senha definida com sucesso.',
    };
  }

  async register(registerDto: RegisterDto): Promise<any> {
    const { email, name, username, organizationId, password } = registerDto;

    // Verifica se já existe um usuário com o mesmo e-mail ou nome de usuário (ambos são únicos no Prisma)
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new ConflictException('E-mail ou nome de usuário já está em uso.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        email,
        name,
        username,
        organizationId,
        password: hashedPassword,
        avatar: '',
        active: true,
      },
    });

    return this.sanitizeUser(newUser);
  }
}
