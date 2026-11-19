import { ValidationPipe } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { UpdateSettingsDto } from './dto/update-settings.dto';

describe('Settings — UpdateSettingsDto Validation (Etapa 6)', () => {
  const validationPipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  it('deve aceitar primaryForegroundColor, secondaryColor e campos opcionais vazios', async () => {
    const dto = (await validationPipe.transform(
      {
        siteName: 'Prefeitura Municipal',
        siteDescription: '',
        logoUrl: '',
        faviconUrl: '',
        primaryColor: '#1e3a8a',
        primaryForegroundColor: '#ffffff',
        secondaryColor: '#f59e0b',
        secondaryForegroundColor: '#000000',
        themeColors: { header: '#1e3a8a' },
        socialLinks: { instagram: 'https://instagram.com/pmtb' },
      },
      { type: 'body', metatype: UpdateSettingsDto },
    )) as UpdateSettingsDto;

    expect(dto.primaryForegroundColor).toBe('#ffffff');
    expect(dto.secondaryColor).toBe('#f59e0b');
    expect(dto.logoUrl).toBe('');
  });

  it('deve continuar rejeitando campos somente-leitura como id, visits e updatedAt', async () => {
    await expect(
      validationPipe.transform(
        {
          id: 'singleton',
          visits: 10,
          updatedAt: '2026-01-01T00:00:00Z',
          siteName: 'Prefeitura',
        },
        { type: 'body', metatype: UpdateSettingsDto },
      ),
    ).rejects.toThrow();
  });
});
