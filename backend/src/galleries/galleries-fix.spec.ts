import { ValidationPipe } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { CreateGalleriesDto } from './dto/create-galleries.dto';
import { UpdateGalleriesDto } from './dto/update-galleries.dto';

describe('Galleries — Nested Slides DTO Validation (Etapa 4)', () => {
  const validationPipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  const validUuid = '11111111-1111-4111-8111-111111111111';

  it('CreateGalleriesDto e UpdateGalleriesDto devem aceitar slides aninhados sem galleryId', async () => {
    const created = (await validationPipe.transform(
      {
        title: 'Galeria Oficial',
        active: true,
        slides: [
          {
            mediaId: validUuid,
            order: 1,
            caption: 'Foto 1',
            link: 'https://pmtb.pr.gov.br',
          },
        ],
      },
      { type: 'body', metatype: CreateGalleriesDto },
    )) as CreateGalleriesDto;

    expect(created.title).toBe('Galeria Oficial');
    expect(created.slides).toHaveLength(1);
    expect(created.slides?.[0].mediaId).toBe(validUuid);

    const updated = (await validationPipe.transform(
      {
        title: 'Galeria Editada',
        slides: [
          { mediaId: validUuid, order: 1, caption: 'Nova legenda', link: '' },
        ],
      },
      { type: 'body', metatype: UpdateGalleriesDto },
    )) as UpdateGalleriesDto;

    expect(updated.title).toBe('Galeria Editada');
    expect(updated.slides?.[0].caption).toBe('Nova legenda');
  });

  it('UpdateGalleriesDto deve rejeitar campos extras como id raiz e media dentro de slides', async () => {
    await expect(
      validationPipe.transform(
        {
          id: validUuid,
          title: 'Galeria',
        },
        { type: 'body', metatype: UpdateGalleriesDto },
      ),
    ).rejects.toThrow();

    await expect(
      validationPipe.transform(
        {
          title: 'Galeria',
          slides: [
            {
              mediaId: validUuid,
              order: 1,
              media: { id: validUuid, key: 'foto.jpg' },
            },
          ],
        },
        { type: 'body', metatype: UpdateGalleriesDto },
      ),
    ).rejects.toThrow();
  });
});
