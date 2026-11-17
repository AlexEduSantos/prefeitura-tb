import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { SearchService } from './search/search.service';
import { SearchController } from './search/search.controller';
import type { ArticlesService } from './articles/articles.service';
import type { OfficialGazetteService } from './official-gazette/official-gazette.service';
import type { PagesService } from './pages/pages.service';

interface PackageJsonShape {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

describe('TO-DO 2.0 Fase 3 — Débitos Arquiteturais e Refatoração', () => {
  describe('1. Consolidação de Editor Rich-Text (Remoção do TipTap)', () => {
    it('frontend/package.json não deve depender do TipTap e deve manter apenas Lexical', () => {
      const frontendPkg = JSON.parse(
        readFileSync(
          join(process.cwd(), '..', 'frontend', 'package.json'),
          'utf-8',
        ),
      ) as PackageJsonShape;
      expect(frontendPkg.dependencies?.['@tiptap/react']).toBeUndefined();
      expect(frontendPkg.dependencies?.['@tiptap/starter-kit']).toBeUndefined();
      expect(
        frontendPkg.dependencies?.['@tiptap/extension-link'],
      ).toBeUndefined();
      expect(frontendPkg.dependencies?.lexical).toBeDefined();
    });
  });

  describe('2. Eliminação de Hardcodes de Menus e Umami no Frontend', () => {
    it('header.tsx, mobile-header.tsx e footer.tsx não devem conter UUIDs fixos e devem usar useMenuByLocation', () => {
      const frontendDir = join(process.cwd(), '..', 'frontend');
      const headerSrc = readFileSync(
        join(frontendDir, 'components', 'public', 'header.tsx'),
        'utf-8',
      );
      const mobileHeaderSrc = readFileSync(
        join(frontendDir, 'components', 'public', 'mobile-header.tsx'),
        'utf-8',
      );
      const footerSrc = readFileSync(
        join(frontendDir, 'components', 'public', 'footer.tsx'),
        'utf-8',
      );

      for (const content of [headerSrc, mobileHeaderSrc, footerSrc]) {
        expect(content).toContain('useMenuByLocation(');
        expect(content).not.toContain('a80c8356-9cfc-4998-8b5c-c81f395f6dcd');
        expect(content).not.toContain('dec03c06-aa22-4ceb-9dc0-38d445671d68');
        expect(content).not.toContain('efc07819-7131-46ed-9322-0fe352c9b92e');
      }

      const menuServiceSrc = readFileSync(
        join(frontendDir, 'app', 'service', 'menu.service.ts'),
        'utf-8',
      );
      expect(menuServiceSrc).toContain('/menus/by/');
    });

    it('frontend/app/layout.tsx deve ler URL e website-id do Umami via variáveis de ambiente', () => {
      const layoutSrc = readFileSync(
        join(process.cwd(), '..', 'frontend', 'app', 'layout.tsx'),
        'utf-8',
      );
      expect(layoutSrc).toContain('NEXT_PUBLIC_UMAMI_URL');
      expect(layoutSrc).toContain('NEXT_PUBLIC_UMAMI_WEBSITE_ID');
      expect(layoutSrc).not.toContain('http://localhost:3002/script.js');
      expect(layoutSrc).not.toContain('2d337f2d-c590-4975-8e88-d27d7bebd0e1');
    });
  });

  describe('3. Full-Text Search em Migration Oficial + Endpoint Global /search', () => {
    it('fulltext-search.sql deve estar migrado para prisma/migrations', () => {
      const migrationPath = join(
        process.cwd(),
        'prisma',
        'migrations',
        '20261117203000_add_fulltext_search_gin_indexes',
        'migration.sql',
      );
      const legacyPath = join(process.cwd(), 'prisma', 'fulltext-search.sql');

      expect(existsSync(migrationPath)).toBe(true);
      expect(existsSync(legacyPath)).toBe(false);
      const sql = readFileSync(migrationPath, 'utf-8');
      expect(sql).toContain('idx_article_fulltext_pt');
      expect(sql).toContain('idx_official_gazette_fulltext_pt');
    });

    it('SearchService e SearchController devem agregar resultados de notícias, diário oficial e páginas públicas', async () => {
      const findArticlesMock = vi
        .fn()
        .mockResolvedValue([{ id: 'a1', title: 'Obra Escola' }]);
      const findGazetteMock = vi.fn().mockResolvedValue({
        data: [{ id: 'g1', title: 'Edição 1543' }],
        total: 1,
      });
      const findPagesMock = vi
        .fn()
        .mockResolvedValue([{ id: 'p1', title: 'Secretaria de Obras' }]);

      const articlesServiceMock = {
        findAll: findArticlesMock,
      } as unknown as ArticlesService;
      const gazetteServiceMock = {
        findAllPublic: findGazetteMock,
      } as unknown as OfficialGazetteService;
      const pagesServiceMock = {
        findPublicPages: findPagesMock,
      } as unknown as PagesService;

      const service = new SearchService(
        articlesServiceMock,
        gazetteServiceMock,
        pagesServiceMock,
      );
      const controller = new SearchController(service);

      const empty = await controller.search('   ');
      expect(empty.totals.overall).toBe(0);

      const res = await controller.search('obras', '10');
      expect(res.query).toBe('obras');
      expect(res.totals).toEqual({
        articles: 1,
        officialGazettes: 1,
        pages: 1,
        overall: 3,
      });
      expect(findArticlesMock).toHaveBeenCalledWith('obras');
      expect(findGazetteMock).toHaveBeenCalledWith({
        search: 'obras',
        page: 1,
        limit: 10,
      });
      expect(findPagesMock).toHaveBeenCalledWith('obras');
    });
  });

  describe('4. Pipeline CI/CD (GitHub Actions + Trivy + Husky + lint-staged)', () => {
    it('deve conter workflow de CI com tsc, vitest, playwright, audit e Trivy além de Husky/lint-staged', () => {
      const rootDir = join(process.cwd(), '..');
      const ciPath = join(rootDir, '.github', 'workflows', 'ci.yml');
      const huskyPreCommitPath = join(rootDir, '.husky', 'pre-commit');
      const lintStagedPath = join(rootDir, '.lintstagedrc.json');
      const rootPkgPath = join(rootDir, 'package.json');

      expect(existsSync(ciPath)).toBe(true);
      expect(existsSync(huskyPreCommitPath)).toBe(true);
      expect(existsSync(lintStagedPath)).toBe(true);
      expect(existsSync(rootPkgPath)).toBe(true);

      const ciYaml = readFileSync(ciPath, 'utf-8');
      expect(ciYaml).toContain('tsc --noEmit');
      expect(ciYaml).toContain('vitest');
      expect(ciYaml).toContain('playwright');
      expect(ciYaml).toContain('npm audit');
      expect(ciYaml).toContain('trivy-action');

      const rootPkg = JSON.parse(
        readFileSync(rootPkgPath, 'utf-8'),
      ) as PackageJsonShape;
      expect(rootPkg.devDependencies?.husky).toBeDefined();
      expect(rootPkg.devDependencies?.['lint-staged']).toBeDefined();
    });
  });
});
