import { IMedia } from "./media";
import { IUser } from "./user";

export interface IServices {
  id: string;
  title: string;
  link: string;
  altText: string;
  createdAt: Date;
  updatedAt: Date;
  featured: boolean;
  description: string;

  organizationId?: string;
  organization?: any;

  imageId: string;
  image: IMedia;

  userId: string;
  user: IUser;
}

export interface IMetaService {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
