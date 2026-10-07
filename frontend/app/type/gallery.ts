import { IMedia } from "./media";

export interface IGallery {
  id: string;
  title: string;
  active: boolean;
  organizationId?: string;
  organization?: any;
  spaceId?: string | null;
  space?: any;
  userId: string;
  slides: IGalleryImage[];
  createdAt: string;
  updatedAt: string;
}

export interface IGalleryImage {
  id: string;
  banner: IGallery;
  bannerId: string;
  media: IMedia;
  mediaId: string;
  order: number;
  caption: string;
  link: string | null;
  createdAt: string;
  updatedAt: string;
}
