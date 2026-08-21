import { IEntity } from "./entity";
import { IMedia } from "./media";
import { IUser } from "./user";

export interface IStories {
  id: string;
  title: string;
  description: string;
  alt: string;
  createdAt: Date;
  updatedAt: Date;

  coverId: string;
  cover: IMedia;

  items: IStoriesItem[];
}

export interface IStoriesItem {
  id: string;
  order: number;
  caption: string;
  createdAt: Date;
  updatedAt: Date;

  mediaId: string;
  media: IMedia;
}
