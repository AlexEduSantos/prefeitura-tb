import 'reflect-metadata';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { lastValueFrom, of } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';
import { Action } from './casl/action.enum';
import { CaslAbilityFactory } from './casl/casl-ability.factory';
import { CHECK_POLICIES_KEY } from './casl/check-policies.decorator';
import { PoliciesGuard } from './casl/policies.guard';
import { SessionGuard } from './auth/session.guard';
import { UserRole } from './generated/prisma/enums';
import { ExcludePasswordInterceptor } from './common/interceptors/exclude-password.interceptor';
import { OfficialGazetteService } from './official-gazette/official-gazette.service';
import { OfficialGazetteController } from './official-gazette/official-gazette.controller';
import { PopupsService } from './popups/popups.service';
import { PopupsController } from './popups/popups.controller';
import { GalleriesService } from './galleries/galleries.service';
import { GalleriesController } from './galleries/galleries.controller';
import { GalleryMediaController } from './gallery-media/gallery-media.controller';
import { StoryService } from './story/story.service';
import { StoryController } from './story/story.controller';
import { OrganizationsService } from './organizations/organizations.service';
import { OrganizationsController } from './organizations/organizations.controller';
import { ServicesService } from './service/services.service';
import { ServiceController } from './service/services.controller';
import { MenusController } from './menu/menu.controller';
import { MenusService } from './menu/menu.service';
import { MenuItemController } from './menu-item/menu-item.controller';
import { PagesService } from './pages/pages.service';
import { PagesController } from './pages/pages.controller';
import { MediaController } from './media/media.controller';
import { AnalyticsController } from './analytics/analytics.controller';
import { ArticlesService } from './articles/articles.service';

describe('TO-DO 4.0 — Varredura LGPD, Separação Admin vs Public e Fluxo MANAGER', () => {
  describe('NÍVEL 1: Blindagem contra Vazamento de E-mail e Papel de Servidores (LGPD)', () => {
    it('OfficialGazetteService.findOne (público) deve omitir email e role de createdBy/updatedBy', async () => {
      const findUnique = vi.fn().mockResolvedValue({
        id: 'gaz-1',
        title: 'Diário 01',
        createdBy: { name: 'João Servidor' },
      });
      const service = new OfficialGazetteService({
        officialGazette: { findUnique },
      } as any);

      await service.findOne('gaz-1');
      const selectArg = findUnique.mock.calls[0][0].select;
      expect(selectArg.createdBy).toEqual({ select: { name: true } });
      expect(selectArg.updatedBy).toBeUndefined();

      await service.findOneAdmin('gaz-1');
      const adminInclude = findUnique.mock.calls[1][0].include;
      expect(adminInclude.createdBy.select.email).toBe(true);
      expect(adminInclude.createdBy.select.role).toBe(true);
    });

    it('ExcludePasswordInterceptor deve remover email/role/phone/username em rotas públicas e preservar em /admin', async () => {
      const interceptor = new ExcludePasswordInterceptor();
      const rawPayload = {
        id: 'item-1',
        title: 'Publicação',
        user: {
          id: 'u1',
          name: 'Maria',
          email: 'maria@pmtb.pr.gov.br',
          role: 'ADMIN',
          username: 'maria',
          phone: '4299999',
          password: 'secret-hash',
          activationTokenHash: 'tok-hash',
        },
      };

      const buildContext = (url: string) =>
        ({
          switchToHttp: () => ({
            getRequest: () => ({ originalUrl: url, url }),
          }),
        }) as unknown as ExecutionContext;

      const handler: CallHandler = {
        handle: () => of(JSON.parse(JSON.stringify(rawPayload))),
      };

      const publicResult = await lastValueFrom(
        interceptor.intercept(buildContext('/official-gazette/gaz-1'), handler),
      );
      expect(publicResult.user.name).toBe('Maria');
      expect(publicResult.user.email).toBeUndefined();
      expect(publicResult.user.role).toBeUndefined();
      expect(publicResult.user.username).toBeUndefined();
      expect(publicResult.user.phone).toBeUndefined();
      expect(publicResult.user.password).toBeUndefined();
      expect(publicResult.user.activationTokenHash).toBeUndefined();

      const adminResult = await lastValueFrom(
        interceptor.intercept(
          buildContext('/official-gazette/admin/gaz-1'),
          handler,
        ),
      );
      expect(adminResult.user.email).toBe('maria@pmtb.pr.gov.br');
      expect(adminResult.user.role).toBe('ADMIN');
      expect(adminResult.user.password).toBeUndefined();
      expect(adminResult.user.activationTokenHash).toBeUndefined();
    });
  });

  describe('NÍVEL 2: Separação Completa Admin vs Public e Filtragem Estrita', () => {
    it('Controllers administrativos devem exigir SessionGuard, PoliciesGuard e @CheckPolicies', () => {
      const protectedMethods: Array<[object, string]> = [
        [OfficialGazetteController.prototype, 'findOneAdmin'],
        [PopupsController.prototype, 'findAllAdmin'],
        [PopupsController.prototype, 'findOneAdmin'],
        [GalleriesController.prototype, 'findAllAdmin'],
        [GalleriesController.prototype, 'findOneAdmin'],
        [GalleryMediaController.prototype, 'findAll'],
        [GalleryMediaController.prototype, 'findOne'],
        [StoryController.prototype, 'findAllStoriesAdmin'],
        [StoryController.prototype, 'findOneAdmin'],
        [OrganizationsController.prototype, 'findAllAdmin'],
        [OrganizationsController.prototype, 'findTreeAdmin'],
        [ServiceController.prototype, 'findAll'],
        [ServiceController.prototype, 'findOne'],
        [MenusController.prototype, 'findAll'],
        [MenusController.prototype, 'findOne'],
        [MenuItemController.prototype, 'findAll'],
        [MenuItemController.prototype, 'findOne'],
        [PagesController.prototype, 'findAll'],
        [PagesController.prototype, 'findOne'],
        [MediaController.prototype, 'listFiles'],
        [MediaController.prototype, 'findAll'],
      ];

      for (const [proto, method] of protectedMethods) {
        const classGuards =
          Reflect.getMetadata(GUARDS_METADATA, proto.constructor) || [];
        const methodGuards =
          Reflect.getMetadata(GUARDS_METADATA, (proto as any)[method]) || [];
        const allGuards = [...classGuards, ...methodGuards];
        expect(allGuards, `${proto.constructor.name}.${method}`).toContain(
          SessionGuard,
        );
        expect(allGuards, `${proto.constructor.name}.${method}`).toContain(
          PoliciesGuard,
        );

        const methodPolicies = Reflect.getMetadata(
          CHECK_POLICIES_KEY,
          (proto as any)[method],
        );
        expect(
          methodPolicies?.length,
          `${proto.constructor.name}.${method} @CheckPolicies`,
        ).toBeGreaterThan(0);
      }

      const analyticsPolicies = Reflect.getMetadata(
        CHECK_POLICIES_KEY,
        AnalyticsController,
      );
      expect(analyticsPolicies?.length).toBeGreaterThan(0);
    });

    it('PopupsService, GalleriesService, StoryService, OrganizationsService, ServicesService e MenusService devem filtrar rascunhos/inativos/expirados no público', async () => {
      const popupsFindMany = vi.fn().mockResolvedValue([]);
      const popupsService = new PopupsService({
        popups: { findMany: popupsFindMany },
      } as any);
      await popupsService.findAll();
      expect(popupsFindMany.mock.calls[0][0].where).toMatchObject({
        active: true,
        status: 'publicado',
        deletedAt: null,
      });

      const galFindMany = vi.fn().mockResolvedValue([]);
      const galleriesService = new GalleriesService({
        galleries: { findMany: galFindMany },
      } as any);
      await galleriesService.findAll();
      expect(galFindMany.mock.calls[0][0].where).toEqual({
        active: true,
        deletedAt: null,
      });

      const storyItemFindMany = vi.fn().mockResolvedValue([]);
      const storyService = new StoryService({
        storiesItem: { findMany: storyItemFindMany },
      } as any);
      await storyService.findAllStoryItems();
      expect(storyItemFindMany.mock.calls[0][0].where).toHaveProperty('AND');

      const orgFindMany = vi.fn().mockResolvedValue([]);
      const orgService = new OrganizationsService({
        organization: { findMany: orgFindMany },
      } as any);
      await orgService.findAll(true);
      expect(orgFindMany.mock.calls[0][0].where).toEqual({ active: true });

      const svcFindMany = vi.fn().mockResolvedValue([]);
      const svcCount = vi.fn().mockResolvedValue(0);
      const servicesService = new ServicesService({
        services: { findMany: svcFindMany, count: svcCount },
      } as any);
      await servicesService.findAllPublic('1', '10');
      expect(svcFindMany.mock.calls[0][0].where).toMatchObject({
        active: true,
        deletedAt: null,
      });

      const menuFindMany = vi.fn().mockResolvedValue([]);
      const menusService = new MenusService({
        menu: { findMany: menuFindMany },
      } as any);
      await menusService.findBy('location', 'header');
      expect(menuFindMany.mock.calls[0][0].where).toEqual({
        location: 'header',
        active: true,
      });
    });

    it('PopupsService.update não deve sobrescrever userId e MediaController.listFiles deve normalizar paginação', async () => {
      const popupUpdate = vi.fn().mockResolvedValue({ id: 'pop-1' });
      const popupsService = new PopupsService({
        popups: { update: popupUpdate },
      } as any);
      await popupsService.update('pop-1', {
        title: 'Novo',
        userId: 'atacante',
      });
      expect(popupUpdate.mock.calls[0][0].data.userId).toBeUndefined();

      const listByPrefix = vi.fn().mockResolvedValue({ files: [] });
      const mediaCtrl = new MediaController(
        { listByPrefix } as any,
        {} as any,
        {} as any,
      );
      await mediaCtrl.listFiles('root', 'abc', '99999', 'desc');
      expect(listByPrefix).toHaveBeenCalledWith('', 1, 100, 'desc');
    });
  });

  describe('NÍVEL 3: Role MANAGER, Fluxo de Aprovação USER -> MANAGER e Soft Delete', () => {
    it('CaslAbilityFactory deve permitir aprovação e soft delete ao MANAGER, bloqueando hard delete e gestão de usuários', () => {
      const factory = new CaslAbilityFactory();
      const managerAbility = factory.createForUser({
        id: 'mgr-1',
        role: UserRole.MANAGER,
      });
      const userAbility = factory.createForUser({
        id: 'usr-1',
        role: UserRole.USER,
        organizationId: 'org-saude',
      });

      expect(managerAbility.can(Action.Approve, 'Page')).toBe(true);
      expect(managerAbility.can(Action.Approve, 'Article')).toBe(true);
      expect(managerAbility.can(Action.SoftDelete, 'Page')).toBe(true);
      expect(managerAbility.can(Action.SoftDelete, 'Services')).toBe(true);
      expect(managerAbility.can(Action.Delete, 'Page')).toBe(false);
      expect(managerAbility.can(Action.Delete, 'Article')).toBe(false);
      expect(managerAbility.can(Action.Read, 'Admin')).toBe(false);
      expect(managerAbility.can(Action.Create, 'User')).toBe(false);
      expect(managerAbility.can(Action.Update, 'User')).toBe(false);

      expect(userAbility.can(Action.Approve, 'Page')).toBe(false);
      expect(userAbility.can(Action.Delete, 'Page')).toBe(false);
      expect(userAbility.can(Action.Create, 'Page')).toBe(true);
    });

    it('Fluxo USER -> MANAGER em PagesService e ArticlesService: criação pendente, edição pendente sem alterar publicado, aprovação e soft delete', async () => {
      // 1. PagesService
      let storedPage: any = {
        id: 'page-1',
        title: 'Publicado Original',
        slug: 'orig',
        content: {},
        published: false,
        workflowStatus: 'pendente_aprovacao',
        pendingAction: null,
        organizationId: 'org-saude',
      };

      const pagesService = new PagesService({
        page: {
          create: vi.fn().mockImplementation(async ({ data }) => {
            storedPage = { ...storedPage, ...data };
            return storedPage;
          }),
          findUnique: vi
            .fn()
            .mockImplementation(async () => ({ ...storedPage })),
          update: vi.fn().mockImplementation(async ({ data }) => {
            const { Prisma } = await import('./generated/prisma/client.js');
            storedPage = {
              ...storedPage,
              ...data,
              pendingAction:
                data.pendingAction === Prisma.DbNull
                  ? null
                  : data.pendingAction,
            };
            return storedPage;
          }),
          delete: vi.fn(),
        },
      } as any);

      // USER tenta criar já publicada -> força published: false + pendente_aprovacao
      const createdByUser = await pagesService.create(
        {
          title: 'Rascunho Saúde',
          slug: 'saude',
          content: {},
          published: true,
          organizationId: 'org-saude',
        },
        'usr-1',
        UserRole.USER,
      );
      expect(createdByUser.published).toBe(false);
      expect(createdByUser.workflowStatus).toBe('pendente_aprovacao');

      // MANAGER aprova -> passa a published: true e aprovado
      const approved = await pagesService.approve('page-1', 'mgr-1');
      expect(approved.published).toBe(true);
      expect(approved.workflowStatus).toBe('aprovado');
      expect(approved.approvedById).toBe('mgr-1');

      // USER edita página já publicada -> conteúdo publicado preservado, alteração vai para pendingAction
      const pendingEdit = await pagesService.update(
        'page-1',
        { title: 'Título Alterado pelo USER' },
        UserRole.USER,
      );
      expect(pendingEdit.title).toBe('Rascunho Saúde');
      expect(pendingEdit.published).toBe(true);
      expect(pendingEdit.workflowStatus).toBe('pendente_aprovacao');
      expect((pendingEdit.pendingAction as any).type).toBe('update');

      // MANAGER aprova alteração pendente -> aplica título alterado
      const approvedEdit = await pagesService.approve('page-1', 'mgr-1');
      expect(approvedEdit.title).toBe('Título Alterado pelo USER');
      expect(approvedEdit.pendingAction).toBeNull();

      // MANAGER remove -> executa apenas Soft Delete (published: false, deletedAt != null)
      const softDeleted = await pagesService.remove('page-1', UserRole.MANAGER);
      expect(softDeleted.published).toBe(false);
      expect(softDeleted.workflowStatus).toBe('excluido');
      expect(softDeleted.deletedAt).toBeInstanceOf(Date);

      // 2. ArticlesService
      let storedArticle: any = {
        id: 'art-1',
        title: 'Notícia',
        status: 'rascunho',
        workflowStatus: 'pendente_aprovacao',
        pendingAction: null,
        publicationDate: null,
      };
      const articlesService = new ArticlesService({
        article: {
          create: vi.fn().mockImplementation(async ({ data }) => {
            storedArticle = { ...storedArticle, ...data };
            return storedArticle;
          }),
          findUnique: vi
            .fn()
            .mockImplementation(async () => ({ ...storedArticle })),
          update: vi.fn().mockImplementation(async ({ data }) => {
            storedArticle = { ...storedArticle, ...data };
            return storedArticle;
          }),
        },
      } as any);

      const artByUser = await articlesService.create(
        {
          title: 'Vacinação',
          slug: 'vacinacao',
          status: 'publicado' as any,
          coverId: 'cov-1',
          authorId: 'usr-1',
          body: {},
        },
        UserRole.USER,
      );
      expect(artByUser.status).toBe('rascunho');
      expect(artByUser.workflowStatus).toBe('pendente_aprovacao');

      const artApproved = await articlesService.approve('art-1', 'mgr-1');
      expect(artApproved.status).toBe('publicado');
      expect(artApproved.workflowStatus).toBe('aprovado');
    });
  });
});
