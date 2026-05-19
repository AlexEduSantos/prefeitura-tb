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
  publication_date?: Date;
  expiration_date?: Date;
  featured: boolean;
  author: string;
  editor?: string;
  created_at: Date;
  updated_at: Date;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  content_type: string;
  display_author: boolean;
  display_date: boolean;
  allow_comments: boolean;
  tags: string[];
  related_articles: string[];
  related_videos: string[];
  gallery_images: IMedia[];
  gallery_autoplay: boolean;
  gallery_interval: number;
  gallery_show_thumbnails: boolean;
  social_preview_title?: string;
  social_preview_image?: string;
  social_preview_description?: string;
  entity_id: IEntity[];
}
