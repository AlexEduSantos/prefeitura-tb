import { IGallery } from "./gallery";
import { IMedia } from "./media";
import { IUser } from "./user";

export type ArticleStatusType =
  | "rascunho"
  | "programado"
  | "publicado"
  | "arquivado"
  | "expirado"
  | "excluido";

export interface IArticle {
  id: string;
  title: string;
  headline?: string;
  coverId?: string;
  cover?: IMedia;
  body: any;
  slug: string;
  type: string;
  status: ArticleStatusType | string;
  publicationDate?: string;
  expirationDate?: string;
  featured: boolean;
  authorId?: string;
  editorId?: string;
  author?: IUser;
  editor?: IUser;
  createdAt: string;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  contentType: string;
  displayAuthor: boolean;
  displayDate: boolean;
  allowComments: boolean;
  tags: string[];
  relatedArticles: string[];
  relatedVideos: string[];
  galleryId: string[];
  gallery: IGallery;
  socialPreviewTitle?: string;
  socialPreviewImage?: string;
  organizationId?: string;
  organization?: any;
  categories?: any[];
  categoryIds?: string[];
  visibility?: string;
}
