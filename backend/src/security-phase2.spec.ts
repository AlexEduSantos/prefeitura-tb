import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ThrottlerGuard } from '@nestjs/throttler';
import { describe, it, expect, vi } from 'vitest';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { validateEnv } from './common/config/env.validation';
import { AuthController } from './auth/auth.controller';
import { MenusController } from './menu/menu.controller';
import {
  ALLOWED_MENU_FILTER_FIELDS,
  MenusService,
} from './menu/menu.service';
import { MediaController, videoDiskStorage } from './media/media.controller';

describe('Fase 2: Hardening e Infraestrutura', () => {
  describe('1. Validação de Variáveis de Ambiente com Zod', () => {
    const validEnv = {
      NODE_ENV: 'production',
      PORT: '3001',
      DATABASE_URL: 'postgresql://postgres:secret@db:5432/pmtb',
      SESSION_SECRET: 'a'.repeat(64),
      S3_ENDPOINT: 'http://minio:9000',
      S3_REGION: 'us-east-1',
      S3_ACCESS_KEY: 'access-key',
      S3_SECRET_KEY: 'secret-key',
      S3_BUCKET: 'prefeitura',
      REDIS_HOST: 'redis',
      REDIS_PORT: '6379',
      REDIS_PASSWORD: 'strong-redis-password',
    };

    it('deve aceitar uma configuração de ambiente válida e converter tipos numéricos', () => {
      const parsed = validateEnv(validEnv);
      expect(parsed.PORT).toBe(3001);
      expect(parsed.REDIS_PORT).toBe(6379);
      expect(parsed.NODE_ENV).toBe('production');
      expect(parsed.SESSION_SECRET.length).toBe(64);
    });

    it('deve rejeitar SESSION_SECRET com menos de 64 caracteres', () => {
      expect(() =>
        validateEnv({
          ...validEnv,
          SESSION_SECRET: 'curta-demais',
        }),
      ).toThrow(/SESSION_SECRET/);
    });

    it('deve rejeitar DATABASE_URL ausente ou vazia', () => {
      expect(() =>
        validateEnv({
          ...validEnv,
          DATABASE_URL: '',
        }),
      ).toThrow(/DATABASE_URL/);
    });
  });

  describe('2. Logout Seguro e Rate Limiting em /auth/login', () => {
    it('deve destruir a sessão no banco e limpar o cookie connect.sid ao fazer logout', async () => {
      const controller = new AuthController({} as any, {} as any);
      const destroyMock = vi.fn((cb: (err?: any) => void) => cb());
      const logoutMock = vi.fn((cb: (err?: any) => void) => cb());
      const clearCookieMock = vi.fn();

      const reqMock = {
        logout: logoutMock,
        session: {
          destroy: destroyMock,
        },
      } as any;

      const resMock = {
        clearCookie: clearCookieMock,
      } as any;

      const result = await controller.logout(reqMock, resMock);

      expect(logoutMock).toHaveBeenCalledTimes(1);
      expect(destroyMock).toHaveBeenCalledTimes(1);
      expect(clearCookieMock).toHaveBeenCalledWith('connect.sid');
      expect(result).toEqual({ message: 'Logout bem-sucedido.' });
    });

    it('deve aplicar ThrottlerGuard e limite de 5 tentativas por minuto em AuthController.login', () => {
      const guards = Reflect.getMetadata(
        GUARDS_METADATA,
        AuthController.prototype.login,
      );
      expect(guards).toContain(ThrottlerGuard);

      const limit = Reflect.getMetadata(
        'THROTTLER:LIMITdefault',
        AuthController.prototype.login,
      );
      const ttl = Reflect.getMetadata(
        'THROTTLER:TTLdefault',
        AuthController.prototype.login,
      );

      expect(limit).toBe(5);
      expect(ttl).toBe(60000);
    });
  });

  describe('3. Correção de Injeção de Coluna no Menu (Allowlist)', () => {
    it('MenusController.findBy deve permitir campos da allowlist e rejeitar campos arbitrários', async () => {
      const findByService = vi.fn().mockResolvedValue([]);
      const controller = new MenusController({ findBy: findByService } as any);

      for (const field of ALLOWED_MENU_FILTER_FIELDS) {
        await expect(controller.findBy(field, 'valor')).resolves.toEqual([]);
      }
      expect(findByService).toHaveBeenCalledTimes(
        ALLOWED_MENU_FILTER_FIELDS.length,
      );

      expect(() => controller.findBy('password', '123')).toThrow(
        BadRequestException,
      );
      expect(() => controller.findBy('__proto__', 'pollute')).toThrow(
        BadRequestException,
      );
    });

    it('MenusService.findBy deve rejeitar campos fora da allowlist e consultar normalmente campos válidos', async () => {
      const findMany = vi.fn().mockResolvedValue([]);
      const service = new MenusService({ menu: { findMany } } as any);

      await expect(service.findBy('email', 'test@pmtb.gov.br')).rejects.toThrow(
        BadRequestException,
      );
      expect(findMany).not.toHaveBeenCalled();

      await service.findBy('active', 'true');
      expect(findMany).toHaveBeenCalledTimes(1);
      expect(findMany.mock.calls[0][0].where).toEqual({ active: true });
    });
  });

  describe('4. Correção de Upload de Vídeo (diskStorage anti-OOM)', () => {
    it('deve configurar videoDiskStorage e usar file.path sem exigir alocação de file.buffer em uploadVideo', async () => {
      expect(videoDiskStorage).toBeDefined();

      const addQueueMock = vi.fn().mockResolvedValue({});
      const saveTempFileMock = vi.fn();
      const createPendingMock = vi
        .fn()
        .mockResolvedValue({ id: 'media-video-1' });

      const controller = new MediaController(
        {
          saveTempFile: saveTempFileMock,
          createPending: createPendingMock,
        } as any,
        {} as any,
        { add: addQueueMock } as any,
      );

      const tempMp4Path = join(tmpdir(), `test-upload-video-${Date.now()}.mp4`);
      writeFileSync(
        tempMp4Path,
        Buffer.from([
          0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f,
          0x6d,
        ]),
      );

      const diskFileMock = {
        path: tempMp4Path,
        mimetype: 'video/mp4',
      } as Express.Multer.File;

      try {
        const result = await controller.uploadVideo(
          { title: 'Vídeo Institucional' } as any,
          diskFileMock,
        );

        expect(saveTempFileMock).not.toHaveBeenCalled();
        expect(createPendingMock).toHaveBeenCalledWith(
          { title: 'Vídeo Institucional' },
          'video',
          'video/mp4',
        );
        expect(addQueueMock).toHaveBeenCalledWith('optimize', {
          mediaId: 'media-video-1',
          tempFilePath: tempMp4Path,
        });
        expect(result).toEqual({ id: 'media-video-1' });
      } finally {
        if (existsSync(tempMp4Path)) {
          unlinkSync(tempMp4Path);
        }
      }
    });
  });
});
