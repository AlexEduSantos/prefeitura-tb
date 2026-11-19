import 'reflect-metadata';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { describe, it, expect, vi } from 'vitest';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { UpdateMediaDto } from './dto/update-media.dto';

describe('Etapa 1 — Arquivos (MediaController / MediaService / UpdateMediaDto)', () => {
  it('MediaController.listFiles deve unir segmentos array do Express v5 e decodificar espaços/acentos sem converter em vírgula', async () => {
    const listByPrefix = vi.fn().mockResolvedValue({ folders: [], files: [] });
    const ctrl = new MediaController(
      { listByPrefix } as any,
      {} as any,
      {} as any,
    );

    await ctrl.listFiles(['root'], '1', '10', 'asc');
    expect(listByPrefix).toHaveBeenNthCalledWith(1, '', 1, 10, 'asc');

    await ctrl.listFiles(['Imagens', '2026'], '1', '20', 'desc');
    expect(listByPrefix).toHaveBeenNthCalledWith(
      2,
      'Imagens/2026',
      1,
      20,
      'desc',
    );

    await ctrl.listFiles(['Imagens', 'Banner%20Principal'], '2', '10', 'asc');
    expect(listByPrefix).toHaveBeenNthCalledWith(
      3,
      'Imagens/Banner Principal',
      2,
      10,
      'asc',
    );

    await ctrl.listFiles(['Imagens', 'Servi%C3%A7os'], '1', '10', 'asc');
    expect(listByPrefix).toHaveBeenNthCalledWith(
      4,
      'Imagens/Serviços',
      1,
      10,
      'asc',
    );
  });

  it('MediaService.listByPrefix deve decodificar caminhos com espaços e acentos e retornar os arquivos da pasta', async () => {
    const folderFindUnique = vi.fn().mockResolvedValue({
      id: 'folder-banner',
      title: 'Banner Principal',
      path: 'Imagens/Banner Principal',
    });
    const folderFindMany = vi.fn().mockResolvedValue([]);
    const mediaFindMany = vi.fn().mockResolvedValue([
      {
        id: 'm-1',
        title: 'Coleta Seletiva',
        type: 'image',
        status: 'ready',
        key: 'Imagens/Banner Principal/coleta-seletiva.webp',
      },
    ]);
    const mediaCount = vi.fn().mockResolvedValue(1);

    const configMock = {
      getOrThrow: vi.fn((key: string) => `mock-${key}`),
    };
    const service = new MediaService(
      {
        folder: { findUnique: folderFindUnique, findMany: folderFindMany },
        media: { findMany: mediaFindMany, count: mediaCount },
      } as any,
      configMock as any,
    );

    const result = await service.listByPrefix(
      ['Imagens', 'Banner%20Principal'],
      1,
      10,
      'asc',
    );

    expect(folderFindUnique).toHaveBeenCalledWith({
      where: { path: 'Imagens/Banner Principal' },
    });
    expect(result.files).toHaveLength(1);
    expect(result.currentFolderId).toBe('folder-banner');
  });

  it('MediaController.removeOne deve delegar exclusão unitária para mediaService.removeMany([id])', async () => {
    const removeMany = vi.fn().mockResolvedValue({ count: 1 });
    const ctrl = new MediaController(
      { removeMany } as any,
      {} as any,
      {} as any,
    );

    await ctrl.removeOne('media-123');
    expect(removeMany).toHaveBeenCalledWith(['media-123']);
  });

  it('UpdateMediaDto sob ValidationPipe estrito deve aceitar payload sanitizado e rejeitar campo extra id', async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });

    const valid = await pipe.transform(
      { title: 'Foto Atualizada', altText: 'Texto alt', tags: ['prefeitura'] },
      { type: 'body', metatype: UpdateMediaDto },
    );
    expect(valid).toMatchObject({ title: 'Foto Atualizada' });

    await expect(
      pipe.transform(
        { id: 'media-1', title: 'Foto Atualizada' },
        { type: 'body', metatype: UpdateMediaDto },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
