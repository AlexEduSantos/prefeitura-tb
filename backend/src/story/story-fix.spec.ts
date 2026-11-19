import { ValidationPipe } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryItemDto } from './dto/update-story-item.dto';
import { StoryService } from './story.service';

describe('Story — Admin Edit & DTO Validation (Etapa 9)', () => {
  const validationPipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  const uuid1 = '11111111-1111-4111-8111-111111111111';

  it('StoryService.updateStoryItem deve permitir editar item expirado/agendado via findUnique sem filtro público de vigência', async () => {
    const mockPrisma = {
      storiesItem: {
        findUnique: vi.fn().mockResolvedValue({
          id: uuid1,
          expirationDate: new Date('2020-01-01T00:00:00Z'),
        }),
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({
          id: uuid1,
          caption: 'Nova legenda',
        }),
      },
    };

    const service = new StoryService(mockPrisma as never);
    const updated = await service.updateStoryItem(uuid1, {
      caption: 'Nova legenda',
    });

    expect(updated.caption).toBe('Nova legenda');
    expect(mockPrisma.storiesItem.findUnique).toHaveBeenCalledWith({
      where: { id: uuid1 },
    });
    expect(mockPrisma.storiesItem.findFirst).not.toHaveBeenCalled();
  });

  it('CreateStoryDto e UpdateStoryItemDto devem aceitar payloads limpos sob ValidationPipe estrito', async () => {
    const created = (await validationPipe.transform(
      {
        title: 'Destaque da Semana',
        description: 'Resumo',
        coverId: uuid1,
      },
      { type: 'body', metatype: CreateStoryDto },
    )) as CreateStoryDto;

    expect(created.title).toBe('Destaque da Semana');
    expect(created.coverId).toBe(uuid1);

    const updatedItem = (await validationPipe.transform(
      {
        mediaId: uuid1,
        caption: 'Legenda',
        link: 'https://pmtb.pr.gov.br',
      },
      { type: 'body', metatype: UpdateStoryItemDto },
    )) as UpdateStoryItemDto;

    expect(updatedItem.caption).toBe('Legenda');
  });
});
