import { ICategory, IOrganization, ISpace } from "./organization";
import { IPage } from "./page";

export type IMenu = {
  id: string;
  title: string;
  location: string;
  description: string;
  active: boolean;
  spaceId: string | null;
  space: ISpace | null;
  organizationId: string | null;
  organization: IOrganization | null;
  createdAt: Date;
  updatedAt: Date;
  items: IMenuItem[];
};

export type IMenuItem = {
  id: string;
  label: string;
  description: string;
  icon: string;
  visible: boolean;
  order: number;
  parentId: string | null;
  parent: IMenuItem | null;
  children: IMenuItem[] | null;
  categoryId: string | null;
  category: ICategory | null;
  url: string | null;
  pageId: string | null;
  page: IPage | null;
  menuId: string;
  menu: IMenu;
  createdAt: Date;
  updatedAt: Date;
};
