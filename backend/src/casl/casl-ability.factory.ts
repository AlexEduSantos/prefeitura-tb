import {
  AbilityBuilder,
  PureAbility,
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
  | SiteSettings;

export type AppAbility = MongoAbility<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user?: Partial<User> & { role?: UserRole }) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createMongoAbility,
    );

    // ==========================================
    // 1. Qualquer um (Público)
    // ==========================================
    // Acesso livre no Portal para leitura de Articles, Pages, Organizations, Spaces e Categories
    can(Action.Read, 'Article');
    can(Action.Read, 'Page');
    can(Action.Read, 'Organization');
    can(Action.Read, 'Space');
    can(Action.Read, 'Category');

    // Se o usuário não estiver autenticado, retorna as regras públicas
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
    // 2. Admin
    // ==========================================
    if (user.role === UserRole.ADMIN) {
      // Manage (Tudo) / Nenhuma condição
      can(Action.Manage, 'all');
    }

    // ==========================================
    // 3. Publisher (Jornalista)
    // ==========================================
    else if (user.role === UserRole.PUBLISHER) {
      // Escrita global em notícias: gerenciar Article, Media e Category
      can(Action.Manage, 'Article');
      can(Action.Manage, 'Media');
      can(Action.Manage, 'Category');
    }

    // ==========================================
    // 4. User (Secretaria/Departamento)
    // ==========================================
    else if (user.role === UserRole.USER) {
      if (user.organizationId) {
        can(Action.Create, 'Page', { organizationId: user.organizationId });
        can(Action.Update, 'Page', { organizationId: user.organizationId });
        can(Action.Delete, 'Page', { organizationId: user.organizationId });
      }
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
