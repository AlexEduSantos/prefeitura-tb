import { IEntity } from "./entity";
import { IMedia } from "./media";
import { IUser } from "./user";

export interface IServices {
  id: string;
  title: string;
  link: string;
  altText: string;
  createdAt: Date;
  updatedAt: Date;

  entityId: string;
  entity: IEntity;

  imageId: string;
  image: IMedia;

  userId: string;
  user: IUser;
}
