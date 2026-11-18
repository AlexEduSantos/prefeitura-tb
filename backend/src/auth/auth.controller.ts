import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Res,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { RegisterDto } from './dto/register.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { AuthService } from './auth.service';
import {
  CSRF_COOKIE_NAME,
  generateCsrfToken,
} from '../common/middleware/csrf.middleware';
import { SessionGuard } from './session.guard';
import { PoliciesGuard } from '../casl/policies.guard';
import { CheckPolicies } from '../casl/check-policies.decorator';
import { Action } from '../casl/action.enum';
import { User } from '../generated/prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private eventEmitter: EventEmitter2,
  ) {}

  @UseGuards(ThrottlerGuard, AuthGuard('local'))
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res?: ExpressResponse,
  ) {
    const user = req.user as User;

    return new Promise((resolve, reject) => {
      req.login(user, (err: Error) => {
        if (err) return reject(err);

        req.session.save((err: Error) => {
          if (err) return reject(err);

          // Atualiza o token CSRF para vinculá-lo ao novo sessionID autenticado
          if (res && typeof res.cookie === 'function') {
            generateCsrfToken(req, res);
          }

          // ✅ Dispara o evento em background e NÃO espera (sem await)
          // O 'login.success' é o nome do evento, e o user.id é o payload.
          this.eventEmitter.emit('login.success', user.id, { async: true });

          // ✅ Resolve a Promise imediatamente, o login já está pronto.
          resolve(user);
        });
      });
    });
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Post('register')
  @CheckPolicies((ability) => ability.can(Action.Create, 'Admin'))
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req: any,
    @Res({ passthrough: true }) res?: ExpressResponse,
  ) {
    return new Promise((resolve, reject) => {
      req.logout((err: Error) => {
        if (err) {
          return reject(err);
        }
        if (req.session && typeof req.session.destroy === 'function') {
          req.session.destroy((destroyErr: Error) => {
            if (destroyErr) {
              return reject(destroyErr);
            }
            res?.clearCookie?.('connect.sid');
            res?.clearCookie?.(CSRF_COOKIE_NAME);
            resolve({ message: 'Logout bem-sucedido.' });
          });
        } else {
          res?.clearCookie?.('connect.sid');
          res?.clearCookie?.(CSRF_COOKIE_NAME);
          resolve({ message: 'Logout bem-sucedido.' });
        }
      });
    });
  }

  @UseGuards(SessionGuard, PoliciesGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }

  @Get('csrf-token')
  getCsrfToken(
    @Request() req: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const csrfToken = generateCsrfToken(req, res);
    return { csrfToken };
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Get('activate-account/validate')
  validateActivationToken(@Query('token') token: string) {
    return this.authService.validateActivationToken(token);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('activate-account')
  @HttpCode(HttpStatus.OK)
  activateAccount(@Body() dto: ActivateAccountDto) {
    return this.authService.activateAccount(dto.token, dto.password);
  }
}
