import { IArticle } from "./article";
import { IPage } from "./page";
import { IUser } from "./user";

export interface IEntity {
  id: string;
  name: String;
  slug: String;
  createdAt: Date;
  pages: IPage[];
  users: IUser[];
  articles: IArticle[];
}
