import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { TelemetryService } from './common/telemetry/telemetry.service';
import { BackupService } from './backup/backup.service';
import { BackupController } from './backup/backup.controller';
import { SessionGuard } from './auth/session.guard';
import { PoliciesGuard } from './casl/policies.guard';
import {
  CHECK_POLICIES_KEY,
  PolicyHandler,
} from './casl/check-policies.decorator';
import { CaslAbilityFactory } from './casl/casl-ability.factory';
import { UserRole } from './generated/prisma/enums';
import { ArticlesService } from './articles/articles.service';
import { OfficialGazetteService } from './official-gazette/official-gazette.service';

describe('Fase 4: Novas Funcionalidades e Observabilidade', () => {
  describe('1. Telemetria e Rastreamento de Erros (Sentry / OpenTelemetry)', () => {
    it('TelemetryService deve gerar traceId/spanId no padrão W3C e registrar exceções capturadas', () => {
      const telemetry = new TelemetryService();
      const err = new Error('Falha simulada na API');

      const event = telemetry.captureException(err, {
        route: '/articles',
        method: 'GET',
      });

      expect(event.traceId).toMatch(/^[0-9a-f]{32}$/);
      expect(event.spanId).toMatch(/^[0-9a-f]{16}$/);
      expect(event.level).toBe('error');
      expect(event.message).toBe('Falha simulada na API');
      expect(event.context).toEqual({ route: '/articles', method: 'GET' });
      expect(telemetry.getRecentEvents().length).toBe(1);
    });
  });

  describe('2. Rotina Automatizada de Backup (PostgreSQL + MinIO)', () => {
    it('BackupController deve exigir SessionGuard, PoliciesGuard e permissão de ADMIN', () => {
      const classGuards = Reflect.getMetadata(
        GUARDS_METADATA,
        BackupController,
      );
      expect(classGuards).toContain(SessionGuard);
      expect(classGuards).toContain(PoliciesGuard);

      const policies: PolicyHandler[] = Reflect.getMetadata(
        CHECK_POLICIES_KEY,
        BackupController.prototype.runBackup,
      );
      expect(policies).toBeDefined();

      const abilityFactory = new CaslAbilityFactory();
      const adminAbility = abilityFactory.createForUser({
        id: 'admin-1',
        role: UserRole.ADMIN,
      });
      const publisherAbility = abilityFactory.createForUser({
        id: 'pub-1',
        role: UserRole.PUBLISHER,
      });

      const checkAll = (ability: any) =>
        policies.every((h) =>
          typeof h === 'function' ? h(ability) : h.handle(ability),
        );

      expect(checkAll(adminAbility)).toBe(true);
      expect(checkAll(publisherAbility)).toBe(false);
    });

    it('BackupService.runBackup deve exportar snapshot do banco e registrar status concluído', async () => {
      const backupDir = join(tmpdir(), `pmtb-test-backup-${Date.now()}`);
      process.env.BACKUP_DIR = backupDir;

      const prismaMock = {
        article: { findMany: vi.fn().mockResolvedValue([{ id: 'a1' }]) },
        page: { findMany: vi.fn().mockResolvedValue([{ id: 'p1' }]) },
        officialGazette: { findMany: vi.fn().mockResolvedValue([]) },
        user: { findMany: vi.fn().mockResolvedValue([{ id: 'u1' }]) },
        media: { findMany: vi.fn().mockResolvedValue([{ id: 'm1' }, { id: 'm2' }]) },
      } as any;

      const configMock = {
        get: vi.fn().mockReturnValue(undefined),
      } as any;

      const service = new BackupService(prismaMock, configMock);
      const summary = await service.runBackup();

      expect(summary.status).toBe('completed');
      expect(summary.databaseRecords).toEqual({
        articles: 1,
        pages: 1,
        officialGazettes: 0,
        users: 1,
        media: 2,
      });
      expect(service.getLastBackupStatus()).toEqual(summary);

      const fileExists = await fs
        .stat(summary.filePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);

      await fs.rm(backupDir, { recursive: true, force: true });
      delete process.env.BACKUP_DIR;
    });
  });

  describe('3. Full-Text Search (tsvector) em Notícias e Diário Oficial', () => {
    it('ArticlesService.findAll deve consultar $queryRaw com tsvector e incluir IDs ranqueados no filtro', async () => {
      const queryRaw = vi
        .fn()
        .mockResolvedValue([{ id: 'art-fts-1' }, { id: 'art-fts-2' }]);
      const findMany = vi.fn().mockResolvedValue([]);

      const service = new ArticlesService({
        $queryRaw: queryRaw,
        article: { findMany },
      } as any);

      await service.findAll('pavimentação asfáltica');

      expect(queryRaw).toHaveBeenCalledTimes(1);
      const rawSqlParts = queryRaw.mock.calls[0][0].join(' ');
      expect(rawSqlParts).toContain("to_tsvector");
      expect(rawSqlParts).toContain("plainto_tsquery");

      const findManyArgs = findMany.mock.calls[0][0];
      expect(JSON.stringify(findManyArgs.where)).toContain('art-fts-1');
    });

    it('OfficialGazetteService.findAllPublic deve consultar $queryRaw com tsvector e combinar resultados', async () => {
      const queryRaw = vi.fn().mockResolvedValue([{ id: 'gaz-fts-99' }]);
      const count = vi.fn().mockResolvedValue(1);
      const findMany = vi.fn().mockResolvedValue([{ id: 'gaz-fts-99' }]);

      const service = new OfficialGazetteService({
        $queryRaw: queryRaw,
        officialGazette: { count, findMany },
      } as any);

      const result = await service.findAllPublic({
        search: 'decreto licitação',
        page: 1,
        limit: 15,
      });

      expect(queryRaw).toHaveBeenCalledTimes(1);
      const rawSqlParts = queryRaw.mock.calls[0][0].join(' ');
      expect(rawSqlParts).toContain("to_tsvector");
      expect(rawSqlParts).toContain("plainto_tsquery");

      const findManyWhere = findMany.mock.calls[0][0].where;
      expect(JSON.stringify(findManyWhere.OR)).toContain('gaz-fts-99');
      expect(result.total).toBe(1);
    });
  });
});
