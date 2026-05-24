import { IEntity } from "./entity";
import { IMedia } from "./media";

export interface IArticle {
  id: string;
  title: string;
  headline?: string;
  cover: IMedia;
  body: string;
  slug: string;
  type: string;
  status: string;
  publicationDate?: string;
  expirationDate?: string;
  featured: boolean;
  author: string;
  editor?: string;
  createdAt: string;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  contentType: string;
  displayAuthor: boolean;
  displayDate: boolean;
  allowComments: boolean;
  tags: string[];
  relatedArticles: string[];
  relatedVideos: string[];
  galleryImages: IMedia[];
  galleryAutoplay: boolean;
  galleryInterval: number;
  galleryShowThumbnails: boolean;
  socialPreviewTitle?: string;
  socialPreviewImage?: string;
  socialPreviewDescription?: string;
  entity: IEntity;
}
