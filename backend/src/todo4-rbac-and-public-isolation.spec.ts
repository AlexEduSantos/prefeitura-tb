import 'reflect-metadata';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { lastValueFrom, of } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';
import { ConflictException } from '@nestjs/common';
import { Action } from './casl/action.enum';
import { CaslAbilityFactory } from './casl/casl-ability.factory';
import { CHECK_POLICIES_KEY } from './casl/check-policies.decorator';
import { PoliciesGuard } from './casl/policies.guard';
import { SessionGuard } from './auth/session.guard';
import { UserRole } from './generated/prisma/enums';
import { ExcludePasswordInterceptor } from './common/interceptors/exclude-password.interceptor';
import { ApprovalService } from './approval/approval.service';
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

    it('Fluxo ContentChangeRequest: criação pendente sem poluir Page, edição com ConflictException, editar e aprovar, rejeição com histórico preservado, reenvio e soft delete', async () => {
      const changeRequests: any[] = [];
      const pagesStore: any[] = [
        {
          id: 'page-pub',
          title: 'Publicado Original',
          slug: 'orig',
          content: {},
          published: true,
          deletedAt: null,
          organizationId: 'org-saude',
          userId: 'usr-1',
        },
      ];

      const prismaMock: any = {
        contentChangeRequest: {
          findFirst: vi.fn().mockImplementation(async ({ where }: any) => {
            return (
              changeRequests.find((r) => {
                if (where.status && r.status !== where.status) return false;
                if (where.OR) {
                  return where.OR.some(
                    (cond: any) =>
                      (cond.id && r.id === cond.id) ||
                      (cond.entityType &&
                        r.entityType === cond.entityType &&
                        r.entityId === cond.entityId),
                  );
                }
                if (where.entityType && r.entityType !== where.entityType)
                  return false;
                if (where.entityId && r.entityId !== where.entityId)
                  return false;
                return true;
              }) ?? null
            );
          }),
          findMany: vi.fn().mockImplementation(async ({ where }: any) => {
            return changeRequests
              .filter(
                (r) =>
                  (!where?.entityType || r.entityType === where.entityType) &&
                  (!where?.entityId?.in ||
                    where.entityId.in.includes(r.entityId)),
              )
              .slice()
              .reverse();
          }),
          findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
            return changeRequests.find((r) => r.id === where.id) ?? null;
          }),
          create: vi.fn().mockImplementation(async ({ data }: any) => {
            const created = {
              id: `req-${changeRequests.length + 1}`,
              ...data,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            changeRequests.push(created);
            return created;
          }),
          update: vi.fn().mockImplementation(async ({ where, data }: any) => {
            const idx = changeRequests.findIndex((r) => r.id === where.id);
            changeRequests[idx] = {
              ...changeRequests[idx],
              ...data,
              updatedAt: new Date(),
            };
            return changeRequests[idx];
          }),
        },
        page: {
          create: vi.fn().mockImplementation(async ({ data }: any) => {
            const created = {
              id: `page-${pagesStore.length + 1}`,
              ...data,
              deletedAt: null,
            };
            pagesStore.push(created);
            return created;
          }),
          findUnique: vi.fn().mockImplementation(async ({ where }: any) => {
            return pagesStore.find((p) => p.id === where.id) ?? null;
          }),
          update: vi.fn().mockImplementation(async ({ where, data }: any) => {
            const idx = pagesStore.findIndex((p) => p.id === where.id);
            pagesStore[idx] = { ...pagesStore[idx], ...data };
            return pagesStore[idx];
          }),
          delete: vi.fn(),
        },
      };

      const approvalService = new ApprovalService(prismaMock);
      const pagesService = new PagesService(
        prismaMock,
        undefined,
        approvalService,
      );

      // 1. USER cria Página -> gera ContentChangeRequest sem inserir em Page
      const draftResult = await pagesService.create(
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
      expect(draftResult.published).toBe(false);
      expect(draftResult.workflowStatus).toBe('pendente');
      expect(prismaMock.page.create).not.toHaveBeenCalled();
      expect(changeRequests).toHaveLength(1);
      expect(changeRequests[0].requestType).toBe('create');
      expect(changeRequests[0].entityId).toBeNull();

      // 2. MANAGER aprova o pedido de criação -> cria Page real e grava appliedData
      const approvedCreate = await pagesService.approve('req-1', 'mgr-1');
      expect(approvedCreate.title).toBe('Rascunho Saúde');
      expect(approvedCreate.published).toBe(true);
      expect(prismaMock.page.create).toHaveBeenCalledTimes(1);
      expect(changeRequests[0].status).toBe('aprovado');
      expect(changeRequests[0].reviewedById).toBe('mgr-1');
      expect(changeRequests[0].appliedData).toMatchObject({
        title: 'Rascunho Saúde',
      });

      // 3. USER edita página publicada -> mantém original intacto, bloqueia segunda edição simultânea
      const pendingEdit = await pagesService.update(
        'page-pub',
        { title: 'Título Alterado pelo USER' },
        UserRole.USER,
        'usr-1',
      );
      expect(pendingEdit.title).toBe('Publicado Original');
      expect(pendingEdit.workflowStatus).toBe('pendente');

      await expect(
        pagesService.update(
          'page-pub',
          { title: 'Outro Título Concorrente' },
          UserRole.USER,
          'usr-1',
        ),
      ).rejects.toBeInstanceOf(ConflictException);

      // 4. MANAGER rejeita com motivo -> proposedData é preservado
      const rejectedRes = await approvalService.rejectRequest(
        pendingEdit.changeRequestId,
        'mgr-1',
        'Falta revisar o subtítulo',
      );
      expect(rejectedRes.status).toBe('rejeitado');
      expect(rejectedRes.rejectionReason).toBe('Falta revisar o subtítulo');
      expect(rejectedRes.proposedData).toMatchObject({
        title: 'Título Alterado pelo USER',
      });

      // 5. USER corrige rascunho preservado e reenvia -> gera novo registro mantendo histórico da rejeição
      const resubmitted = await approvalService.resubmitRequest(
        rejectedRes.id,
        { title: 'Título Corrigido para Revisão' },
        { id: 'usr-1', role: UserRole.USER },
      );
      expect(resubmitted.status).toBe('pendente');
      expect(changeRequests[1].status).toBe('rejeitado');

      // 6. MANAGER edita proposedData antes de aprovar ("Editar e Aprovar") -> aplica versão editada na Page
      const editedApproval = await approvalService.approveRequest(
        resubmitted.id,
        'mgr-1',
        { title: 'Título Ajustado pelo Manager' },
      );
      expect(editedApproval.entity.title).toBe('Título Ajustado pelo Manager');
      expect(pagesStore[0].title).toBe('Título Ajustado pelo Manager');

      // 7. USER solicita exclusão -> gera RequestType.delete e MANAGER aprova aplicando Soft Delete
      await pagesService.remove('page-pub', UserRole.USER, false, 'usr-1');
      const softDeleted = await pagesService.approve('page-pub', 'mgr-1');
      expect(softDeleted.published).toBe(false);
      expect(softDeleted.deletedAt).toBeInstanceOf(Date);

      // 8. ArticlesService cria ContentChangeRequest para USER
      const articlesService = new ArticlesService(prismaMock, approvalService);
      const artDraft = await articlesService.create(
        {
          title: 'Vacinação',
          slug: 'vacinacao',
          status: 'publicado' as any,
          coverId: 'cov-1',
          authorId: 'usr-1',
          body: {},
        },
        UserRole.USER,
        'usr-1',
      );
      expect(artDraft.workflowStatus).toBe('pendente');
      expect(changeRequests[changeRequests.length - 1].entityType).toBe(
        'Article',
      );
    });

    it('Alinhamento Soft Delete para MANAGER em MenusService, MenuItemService, OrganizationsService e StoryService', async () => {
      const menuUpdate = vi.fn().mockResolvedValue({ id: 'm1', active: false });
      const menuItemUpdate = vi
        .fn()
        .mockResolvedValue({ id: 'mi1', visible: false });
      const orgUpdate = vi.fn().mockResolvedValue({ id: 'o1', active: false });
      const storyItemsExpire = vi.fn().mockResolvedValue({ count: 2 });

      const menusService = new MenusService({
        menu: { update: menuUpdate, delete: vi.fn() },
      } as any);
      await menusService.remove('m1', UserRole.MANAGER, true);
      expect(menuUpdate).toHaveBeenCalledWith({
        where: { id: 'm1' },
        data: { active: false },
      });

      const orgService = new OrganizationsService({
        organization: {
          findUnique: vi.fn().mockResolvedValue({ id: 'o1' }),
          update: orgUpdate,
          delete: vi.fn(),
        },
      } as any);
      await orgService.remove('o1', UserRole.MANAGER, true);
      expect(orgUpdate).toHaveBeenCalledWith({
        where: { id: 'o1' },
        data: { active: false },
      });

      const storyService = new StoryService({
        stories: {
          findUnique: vi.fn().mockResolvedValue({ id: 'st1', items: [] }),
          delete: vi.fn(),
        },
        storiesItem: {
          updateMany: storyItemsExpire,
          findUnique: vi.fn().mockResolvedValue({ id: 'si1' }),
          update: menuItemUpdate,
          delete: vi.fn(),
        },
      } as any);
      await storyService.remove('st1', UserRole.MANAGER, true);
      expect(storyItemsExpire).toHaveBeenCalledTimes(1);
    });
  });
});
