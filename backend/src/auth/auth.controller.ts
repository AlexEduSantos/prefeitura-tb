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
  Optional,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { AuthService } from './auth.service';
import { GovBrOAuthService } from './govbr-oauth.service';
import { TotpService } from './totp.service';
import { generateCsrfToken } from '../common/middleware/csrf.middleware';
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
    @Optional() private govBrOAuthService?: GovBrOAuthService,
    @Optional() private totpService?: TotpService,
  ) {}

  @UseGuards(ThrottlerGuard, AuthGuard('local'))
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req: ExpressRequest) {
    const user = req.user as User;

    return new Promise((resolve, reject) => {
      req.login(user, (err: Error) => {
        if (err) return reject(err);

        req.session.save((err: Error) => {
          if (err) return reject(err);

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
  @CheckPolicies((ability) => ability.can(Action.Create, 'User'))
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
            resolve({ message: 'Logout bem-sucedido.' });
          });
        } else {
          res?.clearCookie?.('connect.sid');
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

  @Get('govbr/authorize')
  govBrAuthorize(@Query('state') state?: string) {
    if (!this.govBrOAuthService) {
      throw new BadRequestException('Serviço Gov.br indisponível');
    }
    return this.govBrOAuthService.getAuthorizationUrl(state);
  }

  @Post('govbr/callback')
  @HttpCode(HttpStatus.OK)
  async govBrCallback(
    @Body('code') code: string,
    @Request() req: ExpressRequest,
  ) {
    if (!this.govBrOAuthService) {
      throw new BadRequestException('Serviço Gov.br indisponível');
    }
    const user = await this.govBrOAuthService.authenticateWithCode(code);
    return new Promise((resolve, reject) => {
      req.login(user, (err: Error) => {
        if (err) return reject(err);
        req.session.save((saveErr: Error) => {
          if (saveErr) return reject(saveErr);
          this.eventEmitter.emit('login.success', user.id, { async: true });
          resolve(user);
        });
      });
    });
  }

  @UseGuards(SessionGuard)
  @Post('2fa/setup')
  setupTwoFactor(@Request() req: any) {
    if (!this.totpService) {
      throw new BadRequestException('Serviço TOTP indisponível');
    }
    const user = req.user as User | undefined;
    if (!user?.email) {
      throw new UnauthorizedException('Usuário autenticado não encontrado');
    }
    const required = this.totpService.requiresTwoFactor(user.role);
    const { secret, otpauthUrl } = this.totpService.generateSecret(user.email);
    if (req.session) {
      req.session.pendingTotpSecret = secret;
      req.session.twoFactorRequired = required;
    }
    return { secret, otpauthUrl, required };
  }

  @UseGuards(SessionGuard)
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  verifyTwoFactor(
    @Request() req: any,
    @Body('token') token: string,
    @Body('secret') secret?: string,
  ) {
    if (!this.totpService) {
      throw new BadRequestException('Serviço TOTP indisponível');
    }
    const activeSecret = secret || req.session?.pendingTotpSecret;
    if (!activeSecret || !this.totpService.verifyToken(activeSecret, token)) {
      throw new UnauthorizedException('Código TOTP inválido ou expirado');
    }
    if (req.session) {
      req.session.twoFactorVerified = true;
      req.session.totpSecret = activeSecret;
      delete req.session.pendingTotpSecret;
    }
    return { verified: true };
  }
}
