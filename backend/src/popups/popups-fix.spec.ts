import { ValidationPipe } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { CreatePopupDto } from './dto/create-popup.dto';
import { UpdatePopupDto } from './dto/update-popup.dto';

describe('Popups — DTO Validation (Etapa 8)', () => {
  const validationPipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  const validUuid = '11111111-1111-4111-8111-111111111111';

  it('CreatePopupDto deve aceitar type modal e rejeitar type inválido "popup"', async () => {
    const valid = (await validationPipe.transform(
      {
        title: 'Campanha de Vacinação',
        imageId: validUuid,
        type: 'modal',
        status: 'publicado',
        active: true,
        displayTime: 10,
        priority: 1,
        publicationDate: '2026-11-19T12:00:00.000Z',
        expirationDate: '2026-11-30T12:00:00.000Z',
        organizationId: null,
        spaceId: null,
      },
      { type: 'body', metatype: CreatePopupDto },
    )) as CreatePopupDto;

    expect(valid.title).toBe('Campanha de Vacinação');
    expect(valid.type).toBe('modal');

    await expect(
      validationPipe.transform(
        {
          title: 'Campanha',
          imageId: validUuid,
          type: 'popup',
        },
        { type: 'body', metatype: CreatePopupDto },
      ),
    ).rejects.toThrow();
  });

  it('UpdatePopupDto deve rejeitar campos de workflow/soft-delete como workflowStatus e deletedAt', async () => {
    await expect(
      validationPipe.transform(
        {
          title: 'Editado',
          workflowStatus: 'aprovado',
          deletedAt: null,
        },
        { type: 'body', metatype: UpdatePopupDto },
      ),
    ).rejects.toThrow();
  });
});
