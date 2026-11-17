import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { bullBoardAdminMiddleware } from './common/middleware/bull-board-admin.middleware';
import { PopupsService } from './popups/popups.service';

describe('TO-DO 2.0 Fase 1 — Quick Wins (Bloqueadores de Produção)', () => {
  describe('Proteção do Bull Board (/admin/queues)', () => {
    it('deve retornar 401 para requisições não autenticadas', () => {
      const req: any = { isAuthenticated: () => false };
      const json = vi.fn();
      const status = vi.fn().mockReturnValue({ json });
      const res: any = { status };
      const next = vi.fn();

      bullBoardAdminMiddleware(req, res, next);

      expect(status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('deve retornar 403 para usuários autenticados sem role ADMIN', () => {
      const req: any = {
        isAuthenticated: () => true,
        user: { id: 'user-1', role: 'PUBLISHER' },
      };
      const json = vi.fn();
      const status = vi.fn().mockReturnValue({ json });
      const res: any = { status };
      const next = vi.fn();

      bullBoardAdminMiddleware(req, res, next);

      expect(status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('deve chamar next() para usuário autenticado com role ADMIN', () => {
      const req: any = {
        isAuthenticated: () => true,
        user: { id: 'admin-1', role: 'ADMIN' },
      };
      const status = vi.fn();
      const res: any = { status };
      const next = vi.fn();

      bullBoardAdminMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(status).not.toHaveBeenCalled();
    });

    it('app.module.ts e main.ts devem aplicar bullBoardAdminMiddleware em /admin/queues', () => {
      const appModuleSrc = readFileSync(
        join(process.cwd(), 'src', 'app.module.ts'),
        'utf-8',
      );
      const mainSrc = readFileSync(
        join(process.cwd(), 'src', 'main.ts'),
        'utf-8',
      );

      expect(appModuleSrc).toContain('middleware: bullBoardAdminMiddleware');
      expect(mainSrc).toContain("app.use('/admin/queues', bullBoardAdminMiddleware)");
    });
  });

  describe('Sanitização de PII em GET /popups', () => {
    it('PopupsService.findAll deve selecionar apenas name e avatar de user', async () => {
      const findMany = vi.fn().mockResolvedValue([]);
      const service = new PopupsService({ popups: { findMany } } as any);

      await service.findAll();

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            user: { select: { name: true, avatar: true } },
          }),
        }),
      );
    });
  });

  describe('Infraestrutura e Patches Críticos de Dependências', () => {
    it('main.ts deve configurar trust proxy = 1', () => {
      const mainSrc = readFileSync(
        join(process.cwd(), 'src', 'main.ts'),
        'utf-8',
      );
      expect(mainSrc).toContain("app.set('trust proxy', 1)");
    });

    it('backend/Dockerfile deve existir com D maiúsculo e healthcheck do MinIO atualizado', () => {
      const backendFiles = readdirSync(process.cwd());
      expect(backendFiles).toContain('Dockerfile');

      const composeSrc = readFileSync(
        join(process.cwd(), '..', 'docker-compose.yml'),
        'utf-8',
      );
      expect(composeSrc).toContain(
        '["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]',
      );
    });

    it('backend/package.json e frontend/package.json devem refletir patches e limpeza da Fase 1', () => {
      const backendPkg = JSON.parse(
        readFileSync(join(process.cwd(), 'package.json'), 'utf-8'),
      );
      const frontendPkg = JSON.parse(
        readFileSync(
          join(process.cwd(), '..', 'frontend', 'package.json'),
          'utf-8',
        ),
      );

      expect(backendPkg.dependencies['fluent-ffmpeg']).toBeUndefined();
      expect(backendPkg.dependencies.ioredis).toBeDefined();
      expect(backendPkg.dependencies.sharp).toMatch(/^\^?0\.35\./);
      expect(backendPkg.dependencies['@prisma/client']).toMatch(/^\^?7\.1[0-9]\./);
      expect(backendPkg.devDependencies.prisma).toMatch(/^\^?7\.1[0-9]\./);

      expect(frontendPkg.dependencies.shadcn).toBeUndefined();
      expect(frontendPkg.devDependencies.shadcn).toBeDefined();
      expect(frontendPkg.dependencies.next).toMatch(/^16\.4\./);
      expect(frontendPkg.devDependencies['eslint-config-next']).toMatch(/^16\.4\./);
    });
  });
});
