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
  Entity,
  Galleries,
  GalleryMedia,
  Media,
  Page,
  Popups,
  User,
  UserRole,
} from '../generated/prisma/client';

// Definimos uma classe temporária para Category se ela ainda não existir no Prisma
export class Category {
  id?: string;
  name?: string;
}

// Os Subjects permitidos
export type Subjects =
  | 'all'
  | 'Article'
  | 'Page'
  | 'Media'
  | 'Category'
  | 'User'
  | 'Entity'
  | 'Galleries'
  | 'GalleryMedia'
  | 'Popups'
  | Article
  | Page
  | Media
  | User
  | Category
  | Entity
  | Galleries
  | GalleryMedia
  | Popups;

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
    // Acesso livre no Portal para leitura de Articles, Pages e Entities (Secretarias)
    can(Action.Read, 'Article');
    can(Action.Read, 'Page');
    can(Action.Read, 'Entity');

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
    // 4. User (Secretaria)
    // ==========================================
    else if (user.role === UserRole.USER) {
      // Create, Update, Delete apenas se Page.entityId == User.entityId
      if (user.entityId) {
        can(Action.Create, 'Page', { entityId: user.entityId });
        can(Action.Update, 'Page', { entityId: user.entityId });
        can(Action.Delete, 'Page', { entityId: user.entityId });
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
