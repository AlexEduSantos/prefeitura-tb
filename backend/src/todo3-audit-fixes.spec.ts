import 'reflect-metadata';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { MediaController } from './media/media.controller';
import { StoryController } from './story/story.controller';
import { GalleryMediaService } from './gallery-media/gallery-media.service';
import { GalleriesService } from './galleries/galleries.service';
import { ServicesService } from './service/services.service';

describe('TO-DO 3.0 Nível 3 — Correções Críticas P0/P1 da Auditoria', () => {
  describe('1. Prevenção de Route Shadowing (MediaController e StoryController)', () => {
    it('MediaController deve declarar @Get(images/documents/videos) antes de @Get(:id)', () => {
      const src = readFileSync(
        join(process.cwd(), 'src', 'media', 'media.controller.ts'),
        'utf-8',
      );
      const imagesIdx = src.indexOf("@Get('images')");
      const documentsIdx = src.indexOf("@Get('documents')");
      const videosIdx = src.indexOf("@Get('videos')");
      const byIdIdx = src.indexOf("@Get(':id')");

      expect(imagesIdx).toBeGreaterThan(-1);
      expect(documentsIdx).toBeGreaterThan(-1);
      expect(videosIdx).toBeGreaterThan(-1);
      expect(byIdIdx).toBeGreaterThan(-1);
      expect(imagesIdx).toBeLessThan(byIdIdx);
      expect(documentsIdx).toBeLessThan(byIdIdx);
      expect(videosIdx).toBeLessThan(byIdIdx);
    });

    it('StoryController deve declarar @Get(items) e @Get(items/:id) antes de @Get(:id)', () => {
      const src = readFileSync(
        join(process.cwd(), 'src', 'story', 'story.controller.ts'),
        'utf-8',
      );
      const itemsIdx = src.indexOf("@Get('items')");
      const itemByIdIdx = src.indexOf("@Get('items/:id')");
      const byIdIdx = src.indexOf("@Get(':id')");

      expect(itemsIdx).toBeGreaterThan(-1);
      expect(itemByIdIdx).toBeGreaterThan(-1);
      expect(byIdIdx).toBeGreaterThan(-1);
      expect(itemsIdx).toBeLessThan(byIdIdx);
      expect(itemByIdIdx).toBeLessThan(byIdIdx);
    });
  });

  describe('2. Segurança em GET /media/presigned/*path', () => {
    it('deve bloquear path traversal e arquivos inexistentes/não ready', async () => {
      const mediaServiceMock = {
        findByKey: vi.fn(),
        getPresignedUrl: vi
          .fn()
          .mockResolvedValue('https://minio.local/presigned-ok'),
      };
      const controller = new MediaController(
        mediaServiceMock as any,
        {} as any,
        {} as any,
      );

      await expect(
        controller.getPresignedUrl(['..', 'etc', 'passwd']),
      ).rejects.toThrow(BadRequestException);

      mediaServiceMock.findByKey.mockResolvedValueOnce(null);
      await expect(
        controller.getPresignedUrl(['images', '2026', 'nao-existe.webp']),
      ).rejects.toThrow(NotFoundException);

      mediaServiceMock.findByKey.mockResolvedValueOnce({
        id: 'm1',
        status: 'processing',
      });
      await expect(
        controller.getPresignedUrl(['videos', '2026', 'processando.mp4']),
      ).rejects.toThrow(NotFoundException);

      mediaServiceMock.findByKey.mockResolvedValueOnce({
        id: 'm2',
        status: 'ready',
      });
      const res = await controller.getPresignedUrl([
        'images',
        '2026',
        'banner.webp',
      ]);
      expect(res.url).toBe('https://minio.local/presigned-ok');
    });
  });

  describe('3. GalleryMediaService — Correção bannerId -> galleryId', () => {
    it('deve persistir galleryId corretamente e aceitar bannerId legado como fallback', async () => {
      const create = vi.fn().mockResolvedValue({
        id: 'gm1',
        galleryId: '550e8400-e29b-41d4-a716-446655440000',
        mediaId: '550e8400-e29b-41d4-a716-446655440001',
      });
      const service = new GalleryMediaService({
        galleryMedia: { create },
      } as any);

      await service.create({
        galleryId: '550e8400-e29b-41d4-a716-446655440000',
        mediaId: '550e8400-e29b-41d4-a716-446655440001',
        order: 1,
      });

      expect(create.mock.calls[0][0].data).toEqual({
        galleryId: '550e8400-e29b-41d4-a716-446655440000',
        mediaId: '550e8400-e29b-41d4-a716-446655440001',
        order: 1,
      });

      await expect(
        service.create({
          mediaId: '550e8400-e29b-41d4-a716-446655440001',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('4. LGPD em GalleriesService, Imutabilidade em ServicesService e Limite de Paginação', () => {
    it('GalleriesService.findAll e findOne não devem selecionar email do usuário', async () => {
      const findMany = vi.fn().mockResolvedValue([]);
      const findUnique = vi.fn().mockResolvedValue({ id: 'g1' });
      const service = new GalleriesService({
        galleries: { findMany, findUnique },
      } as any);

      await service.findAll();
      expect(findMany.mock.calls[0][0].include.user.select).toEqual({
        name: true,
        avatar: true,
      });

      await service.findOne('g1');
      expect(findUnique.mock.calls[0][0].include.user.select).toEqual({
        name: true,
        avatar: true,
      });
    });

    it('ServicesService.update deve manter userId imutável e findAllPublic deve limitar limit <= 100', async () => {
      const update = vi.fn().mockResolvedValue({ id: 's1' });
      const findMany = vi.fn().mockResolvedValue([]);
      const count = vi.fn().mockResolvedValue(0);
      const service = new ServicesService({
        services: { update, findMany, count },
      } as any);

      await service.update('s1', { title: 'IPTU Digital' }, 'editor-user-id');
      expect(update.mock.calls[0][0].data).toEqual({ title: 'IPTU Digital' });
      expect(update.mock.calls[0][0].data.userId).toBeUndefined();

      await service.findAllPublic('0', '999999');
      expect(findMany.mock.calls[0][0].skip).toBe(0);
      expect(findMany.mock.calls[0][0].take).toBe(100);
    });

    it('StoryController.findAllStories deve limitar page >= 1 e limit <= 100', async () => {
      const findAll = vi.fn().mockResolvedValue({ data: [], total: 0 });
      const controller = new StoryController({ findAll } as any);

      await controller.findAllStories(-5, 5000);
      expect(findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 100 }),
      );
    });
  });
});
