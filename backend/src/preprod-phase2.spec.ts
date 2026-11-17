import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { describe, it, expect, vi } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  detectFileTypeFromBuffer,
  validateFileMagicBytes,
} from './common/utils/file-type-detector';
import {
  CSRF_COOKIE_NAME,
  csrfProtectionMiddleware,
  generateCsrfToken,
} from './common/middleware/csrf.middleware';
import { TotpService } from './auth/totp.service';
import { GovBrOAuthService } from './auth/govbr-oauth.service';
import { CaslAbilityFactory } from './casl/casl-ability.factory';
import { UserRole } from './generated/prisma/enums';
import { Action } from './casl/action.enum';

describe('TO-DO 2.0 Fase 2 — Hardening e Segurança Contínua', () => {
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

      const fakeExeAsPdf = Buffer.from('MZ\x90\x00<html><script>alert(1)</script>');
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

  describe('2. Proteção CSRF Double Submit Cookie (csrf-csrf)', () => {
    it('deve gerar token no GET, aceitar token válido em POST e bloquear token ausente/inválido em modo estrito com 403', () => {
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
          'x-csrf-enforce': 'true',
        },
      };
      const resPost: any = {
        status: vi.fn().mockReturnValue({ json: vi.fn() }),
        cookie: vi.fn(),
      };

      csrfProtectionMiddleware(reqValidPost, resPost, nextValid);
      expect(nextValid).toHaveBeenCalledTimes(1);

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
          'x-csrf-enforce': 'true',
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
  });

  describe('3. Autenticação Reforçada: Gov.br OAuth2/OIDC e 2FA/TOTP (otplib)', () => {
    it('TotpService deve exigir 2FA para ADMIN/PUBLISHER e validar tokens TOTP via otplib', () => {
      const totp = new TotpService();
      expect(totp.requiresTwoFactor('ADMIN')).toBe(true);
      expect(totp.requiresTwoFactor('PUBLISHER')).toBe(true);
      expect(totp.requiresTwoFactor('USER')).toBe(false);

      const { secret, otpauthUrl } = totp.generateSecret('admin@pmtb.pr.gov.br');
      expect(secret.length).toBeGreaterThanOrEqual(16);
      expect(otpauthUrl).toContain('otpauth://totp/');

      const validToken = totp.generateToken(secret);
      expect(validToken).toMatch(/^\d{6}$/);
      expect(totp.verifyToken(secret, validToken)).toBe(true);
      expect(totp.verifyToken(secret, '000000')).toBe(false);
    });

    it('GovBrOAuthService deve montar URL OIDC correta e autenticar usuário ativo pelo e-mail', async () => {
      process.env.GOVBR_CLIENT_ID = 'pmtb-client-id';
      const prismaMock = {
        user: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'govbr-u1',
            email: 'servidor@pmtb.pr.gov.br',
            role: UserRole.PUBLISHER,
            active: true,
            password: 'hashed-password',
          }),
        },
      } as any;

      const govBr = new GovBrOAuthService(prismaMock);
      const authData = govBr.getAuthorizationUrl('state-123');
      expect(authData.configured).toBe(true);
      expect(authData.url).toContain('response_type=code');
      expect(authData.url).toContain('client_id=pmtb-client-id');
      expect(authData.url).toContain('state=state-123');

      vi.spyOn(govBr as any, 'fetchProfileFromGovBr').mockResolvedValue({
        sub: '12345678900',
        email: 'servidor@pmtb.pr.gov.br',
        name: 'Servidor Público',
      });

      const loggedUser = await govBr.authenticateWithCode('auth-code-xyz');
      expect(loggedUser.email).toBe('servidor@pmtb.pr.gov.br');
      expect(loggedUser.password).toBeUndefined();
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
        join(process.cwd(), 'src', 'organizations', 'organizations.controller.ts'),
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
