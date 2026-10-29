import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionGuard } from './session.guard';
import { LocalStrategy } from './local.strategy';
import { SessionSerializer } from './session.serializer';
import { PrismaModule } from '../prisma/prisma.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UserActivityListener } from '../common/listeners/UserActivityService';

@Module({
  imports: [
    PassportModule.register({ session: true }),
    PrismaModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    SessionSerializer,
    SessionGuard,
    UserActivityListener,
  ],
  exports: [SessionGuard],
})
export class AuthModule {}
