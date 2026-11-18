import { PassportSerializer } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private prisma: PrismaService) {
    super();
  }

  serializeUser(user: any, done: (err: Error | null, user: any) => void): any {
    done(null, user.id);
  }

  async deserializeUser(
    payload: any,
    done: (err: Error | null, payload: any) => void,
  ): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { id: payload } });
    if (!user || !user.active) {
      done(null, null);
    } else {
      const safeUser: Record<string, any> = { ...user };
      delete safeUser.password;
      delete safeUser.activationTokenHash;
      done(null, safeUser);
    }
  }
}
