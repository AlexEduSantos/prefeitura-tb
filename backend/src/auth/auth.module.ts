import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionGuard } from './session.guard';
import { LocalStrategy } from './local.strategy';
import { SessionSerializer } from './session.serializer';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PassportModule.register({ session: true }), PrismaModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    SessionSerializer,
    SessionGuard,
  ],
  exports: [SessionGuard],
})
export class AuthModule {}

