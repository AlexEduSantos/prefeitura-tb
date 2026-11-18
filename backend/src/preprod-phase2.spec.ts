import 'reflect-metadata';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { describe, it, expect, vi } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import {
  detectFileTypeFromBuffer,
  validateFileMagicBytes,
} from './common/utils/file-type-detector';
import {
  CSRF_COOKIE_NAME,
  csrfProtectionMiddleware,
  generateCsrfToken,
} from './common/middleware/csrf.middleware';
import {
  AuthService,
  EXPIRED_OR_USED_ACTIVATION_LINK_MSG,
} from './auth/auth.service';
import { SessionSerializer } from './auth/session.serializer';
import { UserService } from './user/user.service';
import { MailService } from './common/mail/mail.service';
import { CaslAbilityFactory } from './casl/casl-ability.factory';
import { UserRole } from './generated/prisma/enums';
import { Action } from './casl/action.enum';

describe('TO-DO 2.0 / 3.0 — Hardening, CSRF Estrito e Ativação de Conta', () => {
  describe('1. Validação de Magic Bytes em Uploads (uploadDocument / uploadVideo)', () => {
    it('deve reconhecer assinatura PDF e OOXML (docx/xlsx) e rejeitar payload falso no uploadDocument', async () => {
      const pdfHeader = Buffer.from('%PDF-1.7\n%FakePdf');
      const detectedPdf = detectFileTypeFromBuffer(pdfHeader);
      expect(detectedPdf).toEqual({ ext: 'pdf', mime: 'application/pdf' });

      const zipXlsxHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
      const detectedXlsx = detectFileTypeFromBuffer(
        zipXlsxHeader,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(detectedXlsx?.ext).toBe('xlsx');

      const fakeExeAsPdf = Buffer.from(
        'MZ\x90\x00<html><script>alert(1)</script>',
      );
      await expect(
        validateFileMagicBytes(
          { buffer: fakeExeAsPdf, mimetype: 'application/pdf' },
          'document',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve validar vídeo em disco via ftyp/webm e apagar o temporário quando magic bytes forem inválidos', async () => {
      const mp4Path = join(tmpdir(), `phase2-valid-${Date.now()}.mp4`);
      const fakePath = join(tmpdir(), `phase2-invalid-${Date.now()}.mp4`);

      const mp4Buffer = Buffer.from([
        0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
      ]);
      writeFileSync(mp4Path, mp4Buffer);
      writeFileSync(fakePath, Buffer.from('#!/bin/sh\nrm -rf /'));

      try {
        const result = await validateFileMagicBytes(
          { path: mp4Path, mimetype: 'video/mp4' },
          'video',
        );
        expect(result).toEqual({ ext: 'mp4', mime: 'video/mp4' });

        await expect(
          validateFileMagicBytes(
            { path: fakePath, mimetype: 'video/mp4' },
            'video',
          ),
        ).rejects.toThrow(BadRequestException);
        expect(existsSync(fakePath)).toBe(false);
      } finally {
        if (existsSync(mp4Path)) {
          await import('fs/promises').then((fs) => fs.unlink(mp4Path));
        }
      }
    });

    it('MediaController deve chamar validateFileMagicBytes antes de enfileirar documentos e vídeos', () => {
      const mediaCtrlSrc = readFileSync(
        join(process.cwd(), 'src', 'media', 'media.controller.ts'),
        'utf-8',
      );
      expect(mediaCtrlSrc).toContain(
        "await validateFileMagicBytes(file, 'document')",
      );
      expect(mediaCtrlSrc).toContain(
        "await validateFileMagicBytes(file, 'video')",
      );
    });
  });

  describe('2. Proteção CSRF Double Submit Cookie em Modo Estrito (csrf-csrf)', () => {
    it('deve gerar token no GET, aceitar token válido em POST e bloquear token ausente/inválido sem header x-csrf-enforce', () => {
      const cookies: Record<string, { value: string; options: any }> = {};
      const reqGet: any = {
        method: 'GET',
        url: '/auth/csrf-token',
        headers: {},
        sessionID: 'sess-csrf-1',
      };
      const resGet: any = {
        cookie: vi.fn((name: string, val: string, opts: any) => {
          cookies[name] = { value: val, options: opts };
        }),
      };

      const token = generateCsrfToken(reqGet, resGet);
      expect(token).toContain('.');
      expect(cookies[CSRF_COOKIE_NAME]?.value).toBe(token);

      // Mutação com token válido no cookie e header
      const nextValid = vi.fn();
      const reqValidPost: any = {
        method: 'POST',
        originalUrl: '/articles',
        sessionID: 'sess-csrf-1',
        headers: {
          cookie: `${CSRF_COOKIE_NAME}=${encodeURIComponent(token)}`,
          'x-csrf-token': token,
        },
      };
      const resPost: any = {
        status: vi.fn().mockReturnValue({ json: vi.fn() }),
        cookie: vi.fn(),
      };

      csrfProtectionMiddleware(reqValidPost, resPost, nextValid);
      expect(nextValid).toHaveBeenCalledTimes(1);

      // Mutação sem header X-CSRF-Token deve ser bloqueada imediatamente (sem modo permissivo)
      const jsonMissing = vi.fn();
      const statusMissing = vi.fn().mockReturnValue({ json: jsonMissing });
      const nextMissing = vi.fn();
      const reqMissingPost: any = {
        method: 'POST',
        originalUrl: '/articles',
        sessionID: 'sess-csrf-1',
        headers: {
          cookie: `${CSRF_COOKIE_NAME}=${encodeURIComponent(token)}`,
        },
      };

      csrfProtectionMiddleware(
        reqMissingPost,
        { status: statusMissing, cookie: vi.fn() } as any,
        nextMissing,
      );
      expect(statusMissing).toHaveBeenCalledWith(403);
      expect(nextMissing).not.toHaveBeenCalled();

      // Mutação com header divergente
      const jsonErr = vi.fn();
      const statusErr = vi.fn().mockReturnValue({ json: jsonErr });
      const nextBlocked = vi.fn();
      const reqInvalidPost: any = {
        method: 'POST',
        originalUrl: '/articles',
        sessionID: 'sess-csrf-1',
        headers: {
          cookie: `${CSRF_COOKIE_NAME}=${encodeURIComponent(token)}`,
          'x-csrf-token': 'forged.token',
        },
      };

      csrfProtectionMiddleware(
        reqInvalidPost,
        { status: statusErr, cookie: vi.fn() } as any,
        nextBlocked,
      );
      expect(statusErr).toHaveBeenCalledWith(403);
      expect(nextBlocked).not.toHaveBeenCalled();
    });

    it('deve aceitar login pré-autenticação mesmo quando express-session (saveUninitialized: false) gera sessionIDs efêmeros distintos', () => {
      const cookies: Record<string, string> = {};
      const reqGetToken: any = {
        method: 'GET',
        url: '/auth/csrf-token',
        headers: {},
        sessionID: 'ephemeral-sid-1',
        session: {},
      };
      const resGetToken: any = {
        cookie: vi.fn((name: string, val: string) => {
          cookies[name] = val;
        }),
      };

      const token = generateCsrfToken(reqGetToken, resGetToken, true);
      expect(cookies[CSRF_COOKIE_NAME]).toBe(token);

      const nextLogin = vi.fn();
      const statusLogin = vi.fn().mockReturnValue({ json: vi.fn() });
      const reqPostLogin: any = {
        method: 'POST',
        originalUrl: '/auth/login',
        sessionID: 'ephemeral-sid-2',
        session: {},
        headers: {
          cookie: `${CSRF_COOKIE_NAME}=${encodeURIComponent(token)}`,
          'x-csrf-token': token,
        },
      };

      csrfProtectionMiddleware(
        reqPostLogin,
        { status: statusLogin, cookie: vi.fn() } as any,
        nextLogin,
      );
      expect(nextLogin).toHaveBeenCalledTimes(1);
      expect(statusLogin).not.toHaveBeenCalled();
    });
  });

  describe('3. Ativação de Conta por Link de E-mail (Expiração, Uso Único e Bloqueio de Inativos)', () => {
    it('UserService.create deve criar usuário inativo (active: false), gerar token único com expiração e enviar e-mail; resendActivationLink deve gerar novo link', async () => {
      const create = vi.fn().mockResolvedValue({
        id: 'u-new-1',
        email: 'servidor@pmtb.pr.gov.br',
        name: 'Servidor Novo',
        active: false,
      });
      const findUnique = vi.fn().mockResolvedValue({
        id: 'u-new-1',
        email: 'servidor@pmtb.pr.gov.br',
        name: 'Servidor Novo',
      });
      const update = vi.fn().mockResolvedValue({ id: 'u-new-1' });
      const mailService = new MailService();
      const sendSpy = vi.spyOn(mailService, 'sendAccountActivationEmail');

      const userService = new UserService(
        { user: { create, findUnique, update } } as any,
        mailService,
      );

      const created = await userService.create({
        name: 'Servidor Novo',
        username: 'servidor.novo',
        email: 'servidor@pmtb.pr.gov.br',
        role: UserRole.PUBLISHER,
      });

      expect(created.active).toBe(false);
      const createdData = create.mock.calls[0][0].data;
      expect(createdData.active).toBe(false);
      expect(createdData.activationTokenHash).toMatch(/^[a-f0-9]{64}$/);
      expect(createdData.activationTokenMaxUses).toBe(1);
      expect(createdData.activationTokenUsedCount).toBe(0);
      expect(createdData.activationTokenExpiresAt.getTime()).toBeGreaterThan(
        Date.now(),
      );

      expect(sendSpy).toHaveBeenCalledTimes(1);
      const firstToken = sendSpy.mock.calls[0][0].token;
      expect(firstToken.length).toBeGreaterThanOrEqual(32);

      const resendResult = await userService.resendActivationLink('u-new-1');
      expect(resendResult.message).toContain('Novo link de ativação');
      expect(sendSpy).toHaveBeenCalledTimes(2);
      const secondToken = sendSpy.mock.calls[1][0].token;
      expect(secondToken).not.toBe(firstToken);
    });

    it('AuthService e SessionSerializer devem bloquear usuário inativo e ativar após uso único do link válido', async () => {
      const initialPasswordHash = await bcrypt.hash('TempPass123!', 10);
      const rawToken = 'token-ativacao-servidor-teste-001';
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');

      const dbUser: any = {
        id: 'u-act-1',
        name: 'Ana Paula',
        email: 'ana@pmtb.pr.gov.br',
        password: initialPasswordHash,
        role: UserRole.PUBLISHER,
        active: false,
        activationTokenHash: tokenHash,
        activationTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
        activationTokenMaxUses: 1,
        activationTokenUsedCount: 0,
      };

      const prismaMock = {
        user: {
          findUnique: vi.fn().mockImplementation(async ({ where }) => {
            if (where.email === dbUser.email || where.id === dbUser.id) {
              return { ...dbUser };
            }
            return null;
          }),
          findFirst: vi.fn().mockImplementation(async ({ where }) => {
            if (where.activationTokenHash === dbUser.activationTokenHash) {
              return { ...dbUser };
            }
            return null;
          }),
          updateMany: vi.fn().mockImplementation(async ({ where, data }) => {
            if (
              where.id === dbUser.id &&
              where.activationTokenHash === dbUser.activationTokenHash &&
              dbUser.activationTokenUsedCount < dbUser.activationTokenMaxUses &&
              dbUser.activationTokenExpiresAt.getTime() > Date.now()
            ) {
              dbUser.password = data.password;
              dbUser.active = data.active;
              dbUser.activationTokenUsedCount += 1;
              dbUser.activationTokenHash = data.activationTokenHash;
              dbUser.activationTokenExpiresAt = data.activationTokenExpiresAt;
              return { count: 1 };
            }
            return { count: 0 };
          }),
        },
      } as any;

      const authService = new AuthService(prismaMock);
      const serializer = new SessionSerializer(prismaMock);

      // 1. Usuário inativo é bloqueado no login e na desserialização de sessão
      await expect(
        authService.validateUser('ana@pmtb.pr.gov.br', 'TempPass123!'),
      ).rejects.toThrow(UnauthorizedException);

      const deserializeBefore = vi.fn();
      await serializer.deserializeUser('u-act-1', deserializeBefore);
      expect(deserializeBefore).toHaveBeenCalledWith(null, null);

      // 2. Validação do link retorna dados do usuário
      const validation = await authService.validateActivationToken(rawToken);
      expect(validation.valid).toBe(true);
      expect(validation.email).toBe('ana@pmtb.pr.gov.br');

      // 3. Definição da nova senha ativa a conta e consome o token (1 uso)
      const activation = await authService.activateAccount(
        rawToken,
        'MinhaNovaSenhaSegura!2026',
      );
      expect(activation.message).toContain('sucesso');
      expect(dbUser.active).toBe(true);
      expect(dbUser.activationTokenUsedCount).toBe(1);
      expect(dbUser.activationTokenHash).toBeNull();

      // 4. Novo login com a nova senha passa a funcionar e sessão hidrata normalmente
      const logged = await authService.validateUser(
        'ana@pmtb.pr.gov.br',
        'MinhaNovaSenhaSegura!2026',
      );
      expect(logged.email).toBe('ana@pmtb.pr.gov.br');
      expect(logged.password).toBeUndefined();

      const deserializeAfter = vi.fn();
      await serializer.deserializeUser('u-act-1', deserializeAfter);
      expect(deserializeAfter.mock.calls[0][0]).toBeNull();
      expect(deserializeAfter.mock.calls[0][1]?.email).toBe(
        'ana@pmtb.pr.gov.br',
      );

      // 5. Segunda tentativa de uso do mesmo link é rejeitada com orientação para contatar o Administrador
      await expect(
        authService.activateAccount(rawToken, 'OutraSenha123!'),
      ).rejects.toThrow(EXPIRED_OR_USED_ACTIVATION_LINK_MSG);
    });

    it('deve rejeitar link expirado com mensagem orientando contato com o Administrador', async () => {
      const rawToken = 'token-expirado-123';
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');

      const authService = new AuthService({
        user: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'u-exp-1',
            name: 'Carlos',
            email: 'carlos@pmtb.pr.gov.br',
            activationTokenHash: tokenHash,
            activationTokenExpiresAt: new Date(Date.now() - 60_000),
            activationTokenMaxUses: 1,
            activationTokenUsedCount: 0,
          }),
        },
      } as any);

      await expect(
        authService.validateActivationToken(rawToken),
      ).rejects.toThrow(BadRequestException);

      await expect(
        authService.activateAccount(rawToken, 'NovaSenha123!'),
      ).rejects.toThrow(EXPIRED_OR_USED_ACTIVATION_LINK_MSG);
    });

    it('Gov.br e TOTP devem ter sido removidos conforme redefinição de escopo do TO-DO 3.0', () => {
      expect(
        existsSync(
          join(process.cwd(), 'src', 'auth', 'govbr-oauth.service.ts'),
        ),
      ).toBe(false);
      expect(
        existsSync(join(process.cwd(), 'src', 'auth', 'totp.service.ts')),
      ).toBe(false);
      const authCtrlSrc = readFileSync(
        join(process.cwd(), 'src', 'auth', 'auth.controller.ts'),
        'utf-8',
      );
      expect(authCtrlSrc).not.toContain('govbr');
      expect(authCtrlSrc).not.toContain('2fa/setup');
    });
  });

  describe('4. Tipagem CASL Estrita sem Admin as any', () => {
    it('CaslAbilityFactory deve suportar subject formal Admin e controllers não devem usar as any em CheckPolicies', () => {
      const factory = new CaslAbilityFactory();
      const adminAbility = factory.createForUser({
        id: '1',
        role: UserRole.ADMIN,
      });
      const userAbility = factory.createForUser({
        id: '2',
        role: UserRole.USER,
      });

      expect(adminAbility.can(Action.Read, 'Admin')).toBe(true);
      expect(userAbility.can(Action.Read, 'Admin')).toBe(false);

      const files = [
        join(process.cwd(), 'src', 'user', 'user.controller.ts'),
        join(process.cwd(), 'src', 'audit', 'audit.controller.ts'),
        join(process.cwd(), 'src', 'categories', 'categories.controller.ts'),
        join(process.cwd(), 'src', 'menu', 'menu.controller.ts'),
        join(process.cwd(), 'src', 'menu-item', 'menu-item.controller.ts'),
        join(
          process.cwd(),
          'src',
          'organizations',
          'organizations.controller.ts',
        ),
        join(process.cwd(), 'src', 'spaces', 'spaces.controller.ts'),
      ];

      for (const file of files) {
        const content = readFileSync(file, 'utf-8');
        expect(content).not.toMatch(/['"]Admin['"]\s+as\s+any/);
        expect(content).not.toMatch(/ability\.can\([^)]+as\s+any/);
      }
    });
  });
});
