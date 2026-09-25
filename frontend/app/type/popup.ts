import { IEntity } from "./entity";
import { IMedia } from "./media";
import { IUser } from "./user";

export interface IPopups {
  id: string;
  title: string;
  link: string;
  active: boolean;
  displayTime: number;
  status: string;
  type: string;
  position: string;
  closeButton: boolean;
  priority: number;
  publicationDate: Date;
  expirationDate: Date;
  createdAt: Date;
  updatedAt: Date;

  imageId: string;
  image: IMedia;

  entityId: string;
  entity: IEntity;

  userId: string;
  user: IUser;
}
