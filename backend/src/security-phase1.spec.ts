import 'reflect-metadata';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { describe, it, expect, vi } from 'vitest';
import { AuthController } from './auth/auth.controller';
import { SessionGuard } from './auth/session.guard';
import { PoliciesGuard } from './casl/policies.guard';
import { CHECK_POLICIES_KEY, PolicyHandler } from './casl/check-policies.decorator';
import { CaslAbilityFactory } from './casl/casl-ability.factory';
import { Action } from './casl/action.enum';
import { UserRole } from './generated/prisma/enums';
import { ArticlesController } from './articles/articles.controller';
import { PagesController } from './pages/pages.controller';
import { AnalyticsController } from './analytics/analytics.controller';
import { MediaController } from './media/media.controller';
import { ArticlesService } from './articles/articles.service';
import { PagesService } from './pages/pages.service';
import { UserService } from './user/user.service';
import { PopupsService } from './popups/popups.service';
import { CreateUserDto } from './user/dto/create-user.dto';
import { UpdatePageDto } from './pages/dto/update-page.dto';
import { CreatePopupDto } from './popups/dto/create-popup.dto';

describe('Fase 1: Segurança e Correções Críticas', () => {
  describe('1. Restrição da rota de registro (/auth/register)', () => {
    it('deve proteger AuthController.register com SessionGuard, PoliciesGuard e política Action.Create User', () => {
      const guards = Reflect.getMetadata(
        GUARDS_METADATA,
        AuthController.prototype.register,
      );
      expect(guards).toContain(SessionGuard);
      expect(guards).toContain(PoliciesGuard);

      const policies: PolicyHandler[] = Reflect.getMetadata(
        CHECK_POLICIES_KEY,
        AuthController.prototype.register,
      );
      expect(policies).toBeDefined();
      expect(policies.length).toBeGreaterThan(0);

      const abilityFactory = new CaslAbilityFactory();
      const adminAbility = abilityFactory.createForUser({
        id: 'admin-id',
        role: UserRole.ADMIN,
      });
      const publisherAbility = abilityFactory.createForUser({
        id: 'pub-id',
        role: UserRole.PUBLISHER,
      });
      const userAbility = abilityFactory.createForUser({
        id: 'user-id',
        role: UserRole.USER,
        organizationId: 'org-1',
      });
      const anonAbility = abilityFactory.createForUser(undefined);

      const checkAll = (ability: any) =>
        policies.every((h) =>
          typeof h === 'function' ? h(ability) : h.handle(ability),
        );

      expect(checkAll(adminAbility)).toBe(true);
      expect(checkAll(publisherAbility)).toBe(false);
      expect(checkAll(userAbility)).toBe(false);
      expect(checkAll(anonAbility)).toBe(false);
    });
  });

  describe('2. Proteção de Endpoints Administrativos e Rascunhos', () => {
    it('deve exigir SessionGuard e PoliciesGuard em GET /articles/id/:id', () => {
      const guards = Reflect.getMetadata(
        GUARDS_METADATA,
        ArticlesController.prototype.findOneById,
      );
      expect(guards).toContain(SessionGuard);
      expect(guards).toContain(PoliciesGuard);

      const policies: PolicyHandler[] = Reflect.getMetadata(
        CHECK_POLICIES_KEY,
        ArticlesController.prototype.findOneById,
      );
      expect(policies).toBeDefined();
      expect(policies.length).toBeGreaterThan(0);
    });

    it('deve exigir SessionGuard em GET /pages e GET /pages/:id, mantendo rotas públicas abertas', () => {
      expect(
        Reflect.getMetadata(GUARDS_METADATA, PagesController.prototype.findAll),
      ).toContain(SessionGuard);
      expect(
        Reflect.getMetadata(GUARDS_METADATA, PagesController.prototype.findOne),
      ).toContain(SessionGuard);

      expect(
        Reflect.getMetadata(GUARDS_METADATA, PagesController.prototype.findPublic),
      ).toBeUndefined();
      expect(
        Reflect.getMetadata(
          GUARDS_METADATA,
          PagesController.prototype.findByRootSlug,
        ),
      ).toBeUndefined();
      expect(
        Reflect.getMetadata(
          GUARDS_METADATA,
          PagesController.prototype.findBySpaceAndSlug,
        ),
      ).toBeUndefined();
    });

    it('deve exigir SessionGuard e PoliciesGuard no nível do AnalyticsController', () => {
      const classGuards = Reflect.getMetadata(GUARDS_METADATA, AnalyticsController);
      expect(classGuards).toContain(SessionGuard);
      expect(classGuards).toContain(PoliciesGuard);
    });

    it('deve exigir SessionGuard e PoliciesGuard nas listagens de MediaController e manter serveFile público', () => {
      const protectedMethods = [
        'listFiles',
        'findAll',
        'findOne',
        'findImages',
        'findDocuments',
        'findVideos',
      ] as const;

      for (const method of protectedMethods) {
        const guards = Reflect.getMetadata(
          GUARDS_METADATA,
          MediaController.prototype[method],
        );
        expect(guards).toContain(SessionGuard);
        expect(guards).toContain(PoliciesGuard);
      }

      const serveFileGuards = Reflect.getMetadata(
        GUARDS_METADATA,
        MediaController.prototype.serveFile,
      );
      expect(serveFileGuards).toBeUndefined();
    });
  });

  describe('3. Sanitização LGPD de Dados Pessoais em Rotas Públicas', () => {
    it('ArticlesService.findAll e findOne devem selecionar apenas id, name e avatar de author/editor', async () => {
      const findMany = vi.fn().mockResolvedValue([]);
      const findFirst = vi.fn().mockResolvedValue({ id: 'art-1' });
      const prismaMock = {
        article: { findMany, findFirst },
      } as any;

      const service = new ArticlesService(prismaMock);

      await service.findAll();
      expect(findMany).toHaveBeenCalledTimes(1);
      const findAllArgs = findMany.mock.calls[0][0];
      expect(findAllArgs.include.author).toEqual({
        select: { id: true, name: true, avatar: true },
      });
      expect(findAllArgs.include.editor).toEqual({
        select: { id: true, name: true, avatar: true },
      });

      await service.findOne('meu-artigo');
      expect(findFirst).toHaveBeenCalledTimes(1);
      const findOneArgs = findFirst.mock.calls[0][0];
      expect(findOneArgs.include.author).toEqual({
        select: { id: true, name: true, avatar: true },
      });
      expect(findOneArgs.include.editor).toEqual({
        select: { id: true, name: true, avatar: true },
      });
    });

    it('PagesService.findPublicPages deve selecionar apenas name e avatar do usuário', async () => {
      const findMany = vi.fn().mockResolvedValue([]);
      const prismaMock = { page: { findMany } } as any;

      const service = new PagesService(prismaMock);
      await service.findPublicPages('educacao');

      expect(findMany).toHaveBeenCalledTimes(1);
      const args = findMany.mock.calls[0][0];
      expect(args.include.user).toEqual({
        select: { name: true, avatar: true },
      });
    });
  });

  describe('4. Prevenção de Stored XSS em Mídias (GET /media/file/*path)', () => {
    it('deve definir X-Content-Type-Options: nosniff e Content-Security-Policy: sandbox ao servir arquivo', async () => {
      const pipe = vi.fn();
      const mediaServiceMock = {
        findByKey: vi.fn().mockResolvedValue({ id: 'm1', status: 'ready' }),
        getS3Object: vi.fn().mockResolvedValue({
          ContentType: 'image/svg+xml',
          ContentLength: 123,
          Body: { pipe },
        }),
      } as any;

      const controller = new MediaController(
        mediaServiceMock,
        {} as any,
        {} as any,
      );

      const headers: Record<string, any> = {};
      const resMock = {
        setHeader: vi.fn((k: string, v: any) => {
          headers[k] = v;
        }),
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        end: vi.fn(),
      } as any;

      await controller.serveFile(['2026', '11', 'arquivo.svg'], resMock);

      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['Content-Security-Policy']).toBe('sandbox');
      expect(pipe).toHaveBeenCalledWith(resMock);
    });
  });

  describe('5. Bloqueio de Mass Assignment (ValidationPipe + Serviços)', () => {
    it('ValidationPipe com whitelist e forbidNonWhitelisted deve rejeitar propriedades extras não declaradas nos DTOs', async () => {
      const pipe = new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      });

      await expect(
        pipe.transform(
          {
            name: 'João',
            username: 'joao',
            email: 'joao@prefeitura.gov.br',
            password: 'Password123!',
            role: UserRole.USER,
            extraForbiddenField: 'hack',
          },
          { type: 'body', metatype: CreateUserDto },
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        pipe.transform(
          {
            title: 'Página',
            userId: 'attacker-id',
          },
          { type: 'body', metatype: UpdatePageDto },
        ),
      ).rejects.toThrow(BadRequestException);

      const validPopup = await pipe.transform(
        {
          title: 'Aviso',
          imageId: '550e8400-e29b-41d4-a716-446655440000',
          organizationId: null,
          spaceId: '',
        },
        { type: 'body', metatype: CreatePopupDto },
      );
      expect(validPopup.title).toBe('Aviso');
    });

    it('UserService deve aplicar hash bcrypt na senha e filtrar campos permitidos contra Mass Assignment', async () => {
      const create = vi.fn().mockResolvedValue({ id: 'u1' });
      const update = vi.fn().mockResolvedValue({ id: 'u1' });
      const service = new UserService({ user: { create, update } } as any);

      await service.create({
        name: 'Maria',
        username: 'maria',
        email: 'maria@pmtb.gov.br',
        password: 'plainPassword123',
        role: UserRole.PUBLISHER,
        organizationId: null,
        injectedField: 'should-not-pass',
      } as any);

      const createData = create.mock.calls[0][0].data;
      expect(createData.password).not.toBe('plainPassword123');
      expect(createData.password).toMatch(/^\$2[aby]\$/);
      expect(createData.injectedField).toBeUndefined();

      await service.update('u1', {
        name: 'Maria Editada',
        password: '',
        injectedAdminFlag: true,
      } as any);

      const updateData = update.mock.calls[0][0].data;
      expect(updateData.name).toBe('Maria Editada');
      expect(updateData.password).toBeUndefined();
      expect(updateData.injectedAdminFlag).toBeUndefined();
    });

    it('PagesService e PopupsService devem filtrar campos não permitidos antes de enviar ao Prisma', async () => {
      const pageCreate = vi.fn().mockResolvedValue({ id: 'p1' });
      const pageUpdate = vi.fn().mockResolvedValue({ id: 'p1' });
      const pagesService = new PagesService({
        page: { create: pageCreate, update: pageUpdate },
      } as any);

      await pagesService.create(
        {
          title: 'Transparência',
          slug: 'transparencia',
          content: {},
          maliciousField: 'evil',
        } as any,
        'user-session-id',
      );
      expect(pageCreate.mock.calls[0][0].data.maliciousField).toBeUndefined();
      expect(pageCreate.mock.calls[0][0].data.userId).toBe('user-session-id');

      await pagesService.update('p1', {
        title: 'Transparência 2',
        userId: 'hijacked-user',
      } as any);
      expect(pageUpdate.mock.calls[0][0].data.userId).toBeUndefined();

      const popupCreate = vi.fn().mockResolvedValue({ id: 'pop1' });
      const popupsService = new PopupsService({
        popups: { create: popupCreate },
      } as any);

      await popupsService.create(
        {
          title: 'Campanha Vacinação',
          imageId: '550e8400-e29b-41d4-a716-446655440000',
          userId: 'spoofed-user',
          extraColumn: 'evil',
        } as any,
        'real-session-user',
      );
      const popupData = popupCreate.mock.calls[0][0].data;
      expect(popupData.userId).toBe('real-session-user');
      expect(popupData.extraColumn).toBeUndefined();
    });
  });
});
