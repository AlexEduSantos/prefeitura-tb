import { IMedia } from "./media";
import { IUser } from "./user";
import { IContentChangeRequest, WorkflowStatus } from "./approval";
import { IOrganization } from "./organization";

export interface IServices {
  id: string;
  title: string;
  link: string;
  altText: string;
  createdAt: Date;
  updatedAt: Date;
  featured: boolean;
  description: string;

  organizationId?: string;
  organization?: IOrganization | null;

  imageId: string;
  image: IMedia;

  userId: string;
  user: IUser;
  workflowStatus?: WorkflowStatus;
  pendingRequest?: IContentChangeRequest | null;
  lastRejectedRequest?: IContentChangeRequest | null;
  changeRequestId?: string;
}

export interface IMetaService {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
