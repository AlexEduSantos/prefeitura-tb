import { JSX } from "react/jsx-runtime";
import { IEntity } from "./entity";
import { IPage } from "./page";

export interface IMenu {
  map(arg0: (item: IMenu) => JSX.Element): import("react").ReactNode;
  id: string;
  name: string;
  location: string;
  entityId: string;
  entity: IEntity;
  items: IMenuItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IMenuItem {
  id: string;
  label: string;
  order: number;
  url?: string;
  menuId: string;
  menu: IMenu;
  pageId?: string;
  page: IPage;
  parentId?: string;
  parent: IMenuItem;
  children?: IMenuItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateMenu {
  name: string;
  location: string;
  entityId: string;
}
