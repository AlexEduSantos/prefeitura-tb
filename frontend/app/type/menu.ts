import { ICategory, IOrganization, ISpace } from "./organization";
import { IPage } from "./pages";

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
  path?: string | null;
  url?: string | null;
  icon?: string | null;
  description?: string | null;
  visible?: boolean;
  order: number;
  openInNewTab: boolean;
  active: boolean;
  parentId: string | null;
  menuId: string;
  pageId: string | null;
  page: IPage | null;
  categoryId: string | null;
  category: ICategory | null;
  createdAt: Date;
  updatedAt: Date;
  children: IMenuItem[];
};
