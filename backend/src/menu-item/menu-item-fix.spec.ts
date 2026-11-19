import { ValidationPipe } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { ReorderMenuItemsDto } from './dto/reorder-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

describe('MenuItem — DTO Validation (Etapa 5)', () => {
  const validationPipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  const uuid1 = '11111111-1111-4111-8111-111111111111';
  const uuid2 = '22222222-2222-4222-8222-222222222222';

  it('UpdateMenuItemDto deve aceitar atualização sem menuId e rejeitar menuId no body', async () => {
    const updated = (await validationPipe.transform(
      {
        label: 'Serviços Online',
        visible: true,
        order: 2,
        url: 'https://pmtb.pr.gov.br',
        pageId: null,
        categoryId: null,
        parentId: null,
      },
      { type: 'body', metatype: UpdateMenuItemDto },
    )) as UpdateMenuItemDto;

    expect(updated.label).toBe('Serviços Online');
    expect(updated.url).toBe('https://pmtb.pr.gov.br');

    await expect(
      validationPipe.transform(
        {
          label: 'Serviços Online',
          menuId: uuid1,
          url: 'https://pmtb.pr.gov.br',
        },
        { type: 'body', metatype: UpdateMenuItemDto },
      ),
    ).rejects.toThrow();
  });

  it('CreateMenuItemDto deve aceitar exatamente um destino (pageId, categoryId ou url)', async () => {
    const created = (await validationPipe.transform(
      {
        label: 'Notícias',
        menuId: uuid1,
        categoryId: uuid2,
        pageId: null,
        url: null,
      },
      { type: 'body', metatype: CreateMenuItemDto },
    )) as CreateMenuItemDto;

    expect(created.label).toBe('Notícias');
    expect(created.menuId).toBe(uuid1);
    expect(created.categoryId).toBe(uuid2);
  });

  it('ReorderMenuItemsDto deve exigir objeto { items: [...] }', async () => {
    const reordered = (await validationPipe.transform(
      {
        items: [
          { id: uuid1, order: 0, parentId: null },
          { id: uuid2, order: 1, parentId: uuid1 },
        ],
      },
      { type: 'body', metatype: ReorderMenuItemsDto },
    )) as ReorderMenuItemsDto;

    expect(reordered.items).toHaveLength(2);
    expect(reordered.items[1].parentId).toBe(uuid1);
  });
});
