import { IEntity } from "./entity";

export interface IUser {
  id: number;
  username: string;
  name: string;
  email: string;
  avatar: string;
  phone: string;
  entityId: string;
  entity: IEntity;
  createdAt: string;
  updatedAt: string;
  role?: "admin" | "journalist" | "secretary";
}
