import { IOrganization, ISpace } from "./organization";

export interface IPage {
  id: string;
  title: string;
  slug: string;
  content: any;
  description?: string;
  published: boolean;
  spaceId?: string | null;
  space?: ISpace | null;
  organizationId?: string | null;
  organization?: IOrganization | null;
  createdAt: Date;
  updatedAt: Date;
}
