import { IOrganization } from "./organization";

export interface IUser {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar: string;
  phone: string;
  active: boolean;
  organizationId?: string | null;
  organization?: IOrganization;
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
  role?: "ADMIN" | "PUBLISHER" | "MANAGER" | "USER";
}
