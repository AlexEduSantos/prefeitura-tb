import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Action } from './action.enum';
import {
  Article,
  Category,
  Galleries,
  GalleryMedia,
  Media,
  Menu,
  MenuItem,
  OfficialGazette,
  Organization,
  Page,
  Popups,
  SiteSettings,
  Services,
  Space,
  Stories,
  User,
  UserRole,
} from '../generated/prisma/client';

// Os Subjects permitidos
export type Subjects =
  | 'all'
  | 'Admin'
  | 'AuditLog'
  | 'Article'
  | 'Page'
  | 'Media'
  | 'Category'
  | 'Organization'
  | 'Space'
  | 'Menu'
  | 'MenuItem'
  | 'User'
  | 'Galleries'
  | 'GalleryMedia'
  | 'Popups'
  | 'Services'
  | 'Stories'
  | 'StoryItem'
  | 'SiteSettings'
  | 'OfficialGazette'
  | Article
  | Page
  | Media
  | User
  | Category
  | Organization
  | Space
  | Menu
  | MenuItem
  | Galleries
  | GalleryMedia
  | Popups
  | Services
  | Stories
  | SiteSettings
  | OfficialGazette;

export type AppAbility = MongoAbility<[Action, Subjects]>;

const CONTENT_SUBJECTS = [
  'Article',
  'Page',
  'Media',
  'Category',
  'Organization',
  'Space',
  'Menu',
  'MenuItem',
  'Galleries',
  'GalleryMedia',
  'Popups',
  'Services',
  'Stories',
  'StoryItem',
  'OfficialGazette',
] as const;

const COLLABORATOR_SUBJECTS = [
  'Article',
  'Page',
  'Media',
  'Popups',
  'Galleries',
  'Services',
] as const;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user?: Partial<User> & { role?: UserRole }) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createMongoAbility,
    );

    // ==========================================
    // 1. Qualquer um (Público)
    // ==========================================
    can(Action.Read, 'Article');
    can(Action.Read, 'Page');
    can(Action.Read, 'Organization');
    can(Action.Read, 'Space');
    can(Action.Read, 'Category');
    can(Action.Read, 'OfficialGazette');

    if (!user) {
      return build({
        detectSubjectType: (item) => {
          if (item && typeof item === 'object') {
            if ('__type' in item) return item.__type as any;
            if ('__typename' in item) return item.__typename as any;
          }
          return item.constructor as any;
        },
      });
    }

    // ==========================================
    // 2. Admin (Controle total, incl. Hard Delete e Usuários)
    // ==========================================
    if (user.role === UserRole.ADMIN) {
      can(Action.Manage, 'all');
    }

    // ==========================================
    // 3. Manager (Revisor / Aprovador + Soft Delete apenas, sem Usuários)
    // ==========================================
    else if (user.role === UserRole.MANAGER) {
      for (const subj of CONTENT_SUBJECTS) {
        can(
          [
            Action.Read,
            Action.Create,
            Action.Update,
            Action.Approve,
            Action.SoftDelete,
          ],
          subj,
        );
      }
      cannot(Action.Delete, 'all');
      cannot(Action.Manage, 'User');
      cannot(Action.Manage, 'Admin');
    }

    // ==========================================
    // 4. Publisher (Jornalista / Publicador Oficial)
    // ==========================================
    else if (user.role === UserRole.PUBLISHER) {
      for (const subj of [
        'Article',
        'Media',
        'Category',
        'OfficialGazette',
      ] as const) {
        can(
          [Action.Read, Action.Create, Action.Update, Action.SoftDelete],
          subj,
        );
      }
      cannot(Action.Delete, 'all');
      cannot(Action.Approve, 'all');
      cannot(Action.Manage, 'User');
      cannot(Action.Manage, 'Admin');
    }

    // ==========================================
    // 5. User (Secretaria/Departamento — Submete para aprovação do Manager)
    // ==========================================
    else if (user.role === UserRole.USER) {
      can(Action.Read, [
        'Page',
        'Article',
        'Media',
        'Popups',
        'Galleries',
        'Services',
        'Category',
        'Organization',
        'Space',
      ]);

      if (user.organizationId) {
        for (const subj of COLLABORATOR_SUBJECTS) {
          can([Action.Create, Action.Update, Action.SoftDelete], subj, {
            organizationId: user.organizationId,
          } as any);
        }
      }

      cannot(Action.Approve, 'all');
      cannot(Action.Delete, 'all');
      cannot(Action.Manage, 'User');
      cannot(Action.Manage, 'Admin');
    }

    return build({
      detectSubjectType: (item) => {
        if (item && typeof item === 'object') {
          if ('__type' in item) return item.__type as any;
          if ('__typename' in item) return item.__typename as any;
        }
        return item.constructor as any;
      },
    });
  }
}
