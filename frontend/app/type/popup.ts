import { IMedia } from "./media";
import { IUser } from "./user";
import { IContentChangeRequest, WorkflowStatus } from "./approval";
import { IOrganization, ISpace } from "./organization";

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

  organizationId?: string;
  organization?: IOrganization | null;
  spaceId?: string | null;
  space?: ISpace | null;

  userId: string;
  user: IUser;
  workflowStatus?: WorkflowStatus;
  pendingRequest?: IContentChangeRequest | null;
  lastRejectedRequest?: IContentChangeRequest | null;
  changeRequestId?: string;
}
