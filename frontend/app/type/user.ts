import { IOrganization } from "./organization";

export interface IUser {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar: string;
  phone: string;
  organizationId?: string;
  organization?: IOrganization;
  createdAt: string;
  updatedAt: string;
  role?: "admin" | "journalist" | "secretary";
}
