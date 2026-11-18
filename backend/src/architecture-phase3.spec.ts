import 'reflect-metadata';
import { describe, it, expect, vi } from 'vitest';
import sharp from 'sharp';
import { MediaService } from './media/media.service';
import { MediaController } from './media/media.controller';
import { ArticlesService } from './articles/articles.service';
import { PagesService } from './pages/pages.service';
import { MenusService } from './menu/menu.service';
import { MenuItemService } from './menu-item/menu-item.service';
import { SettingsService } from './settings/settings.service';
import { RedisCacheService } from './common/cache/redis-cache.service';
import { resolvePagination } from './common/utils/pagination';

describe('Fase 3: Débitos Arquiteturais e Performance', () => {
  const createMockConfigService = () =>
    ({
      getOrThrow: vi.fn((key: string) => {
        const map: Record<string, string> = {
          S3_ENDPOINT: 'http://minio:9000',
          S3_REGION: 'us-east-1',
          S3_ACCESS_KEY: 'test-key',
          S3_SECRET_KEY: 'test-secret',
          S3_BUCKET: 'prefeitura',
        };
        return map[key] || 'mock-val';
      }),
    }) as any;

  describe('1. Desacoplamento MinIO/Backend (S3 e Presigned URLs)', () => {
    it('MediaService.uploadImage deve enviar imagem WebP diretamente para o S3 sem depender de /app/uploads', async () => {
      const mediaCreate = vi.fn().mockImplementation(async ({ data }) => ({
        id: 'm1',
        ...data,
      }));
      const service = new MediaService(
        { media: { create: mediaCreate } } as any,
        createMockConfigService(),
      );

      const uploadToS3Spy = vi
        .spyOn(service, 'uploadToS3')
        .mockResolvedValue({} as any);

      const tinyPng = await sharp({
        create: {
          width: 4,
          height: 4,
          channels: 3,
          background: { r: 10, g: 20, b: 30 },
        },
      })
        .png()
        .toBuffer();

      const result = await service.uploadImage(
        { title: 'Foto Praça Central' } as any,
        { buffer: tinyPng },
      );

      expect(uploadToS3Spy).toHaveBeenCalledTimes(1);
      const [uploadedKey, uploadedBuffer, uploadedMime] =
        uploadToS3Spy.mock.calls[0];
      expect(uploadedKey).toMatch(
        /^images\/\d{4}\/\d{2}\/foto-praca-central-\d+\.webp$/,
      );
      expect(Buffer.isBuffer(uploadedBuffer)).toBe(true);
      expect(uploadedMime).toBe('image/webp');
      expect(result.key).toBe(uploadedKey);
      expect(result.status).toBe('ready');
      expect((result as any).url).toBeUndefined();
    });

    it('MediaController.getPresignedUrl deve retornar URL pré-assinada do S3 para a chave informada', async () => {
      const findByKey = vi
        .fn()
        .mockResolvedValue({ id: 'm1', status: 'ready' });
      const getPresignedUrl = vi
        .fn()
        .mockResolvedValue(
          'http://minio:9000/prefeitura/images/2026/11/foto.webp?X-Amz-Signature=abc',
        );

      const controller = new MediaController(
        { findByKey, getPresignedUrl } as any,
        {} as any,
        {} as any,
      );

      const res = await controller.getPresignedUrl([
        'images',
        '2026',
        '11',
        'foto.webp',
      ]);

      expect(getPresignedUrl).toHaveBeenCalledWith('images/2026/11/foto.webp');
      expect(res.url).toContain('X-Amz-Signature=abc');
    });
  });

  describe('2. Paginação Server-Side Obrigatória (skip e take)', () => {
    it('resolvePagination deve aplicar defaults seguros e teto máximo de 100 itens', () => {
      expect(resolvePagination()).toEqual({ skip: 0, take: 50 });
      expect(resolvePagination({ page: '3', limit: '20' })).toEqual({
        skip: 40,
        take: 20,
      });
      expect(resolvePagination({ skip: '15', take: '500' })).toEqual({
        skip: 15,
        take: 100,
      });
    });

    it('ArticlesService.findAllAdmin, PagesService.findAll e MediaService.findAll devem repassar skip e take ao Prisma', async () => {
      const articleFindMany = vi.fn().mockResolvedValue([]);
      const articlesService = new ArticlesService({
        article: { findMany: articleFindMany },
      } as any);

      await articlesService.findAllAdmin(
        undefined,
        undefined,
        undefined,
        undefined,
        { page: '2', limit: '25' },
      );
      expect(articleFindMany.mock.calls[0][0].skip).toBe(25);
      expect(articleFindMany.mock.calls[0][0].take).toBe(25);

      const pageFindMany = vi.fn().mockResolvedValue([]);
      const pagesService = new PagesService({
        page: { findMany: pageFindMany },
      } as any);

      await pagesService.findAll({ skip: '10', take: '15' });
      expect(pageFindMany.mock.calls[0][0].skip).toBe(10);
      expect(pageFindMany.mock.calls[0][0].take).toBe(15);

      const mediaFindMany = vi.fn().mockResolvedValue([]);
      const mediaService = new MediaService(
        { media: { findMany: mediaFindMany } } as any,
        createMockConfigService(),
      );

      await mediaService.findAll();
      expect(mediaFindMany.mock.calls[0][0].skip).toBe(0);
      expect(mediaFindMany.mock.calls[0][0].take).toBe(50);
    });
  });

  describe('3. Cache Distribuído com Redis e Invalidação nas Mutações', () => {
    it('MenusService e MenuItemService devem cachear leituras e invalidar o cache em mutações', async () => {
      const cache = new RedisCacheService();
      const menuFindMany = vi.fn().mockResolvedValue([{ id: 'm1', items: [] }]);
      const menuUpdate = vi.fn().mockResolvedValue({ id: 'm1' });
      const menuItemCreate = vi.fn().mockResolvedValue({ id: 'mi1' });

      const prismaMock = {
        menu: { findMany: menuFindMany, update: menuUpdate },
        menuItem: { create: menuItemCreate },
      } as any;

      const menusService = new MenusService(prismaMock, cache);
      const menuItemService = new MenuItemService(prismaMock, cache);

      // 1ª leitura consulta o banco; 2ª leitura vem do cache
      await menusService.findAll();
      await menusService.findAll();
      expect(menuFindMany).toHaveBeenCalledTimes(1);

      // Mutação no menu invalida o cache
      await menusService.update('m1', { title: 'Principal' } as any);
      await menusService.findAll();
      expect(menuFindMany).toHaveBeenCalledTimes(2);

      // Mutação em item de menu também invalida cache de menus
      await menuItemService.create('m1', { label: 'Início' } as any);
      await menusService.findAll();
      expect(menuFindMany).toHaveBeenCalledTimes(3);
    });

    it('SettingsService deve cachear getSettings e invalidar ao atualizar', async () => {
      const cache = new RedisCacheService();
      const findUnique = vi.fn().mockResolvedValue({
        id: 'singleton',
        siteTitle: 'Prefeitura Municipal',
      });
      const upsert = vi.fn().mockResolvedValue({
        id: 'singleton',
        siteTitle: 'Prefeitura Atualizada',
      });

      const service = new SettingsService(
        { siteSettings: { findUnique, upsert } } as any,
        cache,
      );

      await service.getSettings();
      await service.getSettings();
      expect(findUnique).toHaveBeenCalledTimes(1);

      await service.updateSettings({
        siteTitle: 'Prefeitura Atualizada',
      } as any);
      await service.getSettings();
      expect(findUnique).toHaveBeenCalledTimes(2);
    });

    it('PagesService deve cachear /pages/public/* e invalidar em create/update/remove', async () => {
      const cache = new RedisCacheService();
      const findMany = vi
        .fn()
        .mockResolvedValue([{ id: 'p1', slug: 'historia' }]);
      const findFirst = vi
        .fn()
        .mockResolvedValue({ id: 'p1', slug: 'historia' });
      const update = vi.fn().mockResolvedValue({ id: 'p1', slug: 'historia' });

      const service = new PagesService(
        { page: { findMany, findFirst, update } } as any,
        cache,
      );

      await service.findPublicPages('');
      await service.findPublicPages('');
      expect(findMany).toHaveBeenCalledTimes(1);

      await service.findByRoute(null, 'historia');
      await service.findByRoute(null, 'historia');
      expect(findFirst).toHaveBeenCalledTimes(1);

      await service.update('p1', { title: 'História Atualizada' });

      await service.findPublicPages('');
      await service.findByRoute(null, 'historia');
      expect(findMany).toHaveBeenCalledTimes(2);
      expect(findFirst).toHaveBeenCalledTimes(2);
    });
  });
});
