export type OrganizationTypes =
  | 'secretaria'
  | 'divisão'
  | 'seção'
  | 'conselho'
  | 'projeto';

export interface ISpace {
  id: string;
  slug: string;
  title: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  parent?: ICategory | null;
  children?: ICategory[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IOrganization {
  id: string;
  name: string;
  acronym?: string | null;
  type: OrganizationTypes;
  active: boolean;
  parentId?: string | null;
  parent?: IOrganization | null;
  children?: IOrganization[];
  defaultSpaceId?: string | null;
  defaultSpace?: ISpace | null;
  createdAt?: string;
  updatedAt?: string;
}
