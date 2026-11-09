import { IMedia } from "./media";

export interface IStories {
  id: string;
  title: string;
  description: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;

  coverId: string;
  cover: IMedia;

  items: IStoriesItem[];
}

export interface IStoriesItem {
  id: string;
  order: number;
  caption?: string | null;
  link?: string | null;
  createdAt: Date;
  updatedAt: Date;

  mediaId: string;
  media: IMedia;

  publishedDate: Date;
  expirationDate: Date;
}
