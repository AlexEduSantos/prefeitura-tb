import {
  BadRequestException,
  ConflictException,
  ValidationPipe,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { CategoriesService } from './categories.service';
import { UpdateCategoryDto } from './dto/update-category.dto';

describe('Categories — DTO Validation & Service (Etapa 3)', () => {
  const validationPipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  it('UpdateCategoryDto deve aceitar payload limpo e rejeitar propriedade id extra', async () => {
    const valid = (await validationPipe.transform(
      { title: 'Notícias', slug: 'noticias' },
      { type: 'body', metatype: UpdateCategoryDto },
    )) as UpdateCategoryDto;

    expect(valid.title).toBe('Notícias');
    expect(valid.slug).toBe('noticias');

    await expect(
      validationPipe.transform(
        { id: 'cat-1', title: 'Notícias', slug: 'noticias' },
        { type: 'body', metatype: UpdateCategoryDto },
      ),
    ).rejects.toThrow();
  });

  it('CategoriesService.update deve bloquear auto-referência em parentId e mapear P2002 para ConflictException', async () => {
    const mockPrisma = {
      category: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ id: 'cat-1', title: 'A', slug: 'a' }),
        update: vi.fn().mockRejectedValue({ code: 'P2002' }),
      },
    };

    const service = new CategoriesService(mockPrisma as never);

    await expect(
      service.update('cat-1', { parentId: 'cat-1' }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.update('cat-1', { title: 'Duplicada', slug: 'duplicada' }),
    ).rejects.toThrow(ConflictException);
  });
});
