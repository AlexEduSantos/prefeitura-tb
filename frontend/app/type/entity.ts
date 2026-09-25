import { IArticle } from "./article";
import { IGallery } from "./gallery";
import { IMenu, IMenuItem } from "./menu";
import { IPage } from "./page";
import { IPopups } from "./popup";
import { IUser } from "./user";

export interface IEntity {
  id: string;
  title: String;
  slug: String;
  createdAt: Date;
  pages: IPage[];
  users: IUser[];
  articles: IArticle[];
  menus: IMenu[];
  menuItems: IMenuItem[];
  popups: IPopups[];
  galleries: IGallery[];
}
