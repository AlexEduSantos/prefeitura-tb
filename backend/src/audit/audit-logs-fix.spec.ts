import { ValidationPipe } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AuditService } from './audit.service';
import { FindAuditLogsDto } from './dto/find-audit.dto';

describe('Audit Logs — DTO Validation & Service (Etapa 2)', () => {
  const validationPipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  it('deve aceitar query params válidos (page, limit, action, entity, search) no ValidationPipe estrito', async () => {
    const transformed = (await validationPipe.transform(
      {
        page: '1',
        limit: '20',
        action: 'CREATE',
        entity: 'Page',
        search: 'admin',
      },
      { type: 'query', metatype: FindAuditLogsDto },
    )) as FindAuditLogsDto;

    expect(transformed).toBeInstanceOf(FindAuditLogsDto);
    expect(transformed.page).toBe(1);
    expect(transformed.limit).toBe(20);
    expect(transformed.action).toBe('CREATE');
    expect(transformed.entity).toBe('Page');
    expect(transformed.search).toBe('admin');
  });

  it('deve rejeitar propriedades não whitelisted e limites inválidos', async () => {
    await expect(
      validationPipe.transform(
        { page: '1', unknownField: 'abc' },
        { type: 'query', metatype: FindAuditLogsDto },
      ),
    ).rejects.toThrow();

    await expect(
      validationPipe.transform(
        { page: '0', limit: '20' },
        { type: 'query', metatype: FindAuditLogsDto },
      ),
    ).rejects.toThrow();

    await expect(
      validationPipe.transform(
        { page: '1', limit: '500' },
        { type: 'query', metatype: FindAuditLogsDto },
      ),
    ).rejects.toThrow();
  });

  it('AuditService.findAll deve paginar corretamente e ignorar datas inválidas', async () => {
    const mockPrisma = {
      auditLog: {
        count: vi.fn().mockResolvedValue(2),
        findMany: vi.fn().mockResolvedValue([
          { id: 'log-1', action: 'CREATE', entity: 'Page' },
          { id: 'log-2', action: 'UPDATE', entity: 'Article' },
        ]),
      },
    };
    const mockQueue = { add: vi.fn() };

    const service = new AuditService(mockPrisma as never, mockQueue as never);
    const result = await service.findAll({
      page: 1,
      limit: 20,
      action: 'all',
      entity: 'Page',
      search: 'admin',
      startDate: 'data-invalida',
      endDate: 'outra-invalida',
    });

    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.totalPages).toBe(1);
    expect(result.data).toHaveLength(2);

    const callArg = mockPrisma.auditLog.findMany.mock.calls[0][0];
    expect(callArg.where.action).toBeUndefined();
    expect(callArg.where.entity).toBe('Page');
    expect(callArg.where.createdAt).toBeUndefined();
    expect(callArg.where.OR).toHaveLength(4);
  });
});
