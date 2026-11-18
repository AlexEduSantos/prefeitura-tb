import { IMedia } from "./media";
import { IContentChangeRequest, WorkflowStatus } from "./approval";
import { IOrganization, ISpace } from "./organization";

export interface IGallery {
  id: string;
  title: string;
  active: boolean;
  organizationId?: string;
  organization?: IOrganization | null;
  spaceId?: string | null;
  space?: ISpace | null;
  userId: string;
  slides: IGalleryImage[];
  createdAt: string;
  updatedAt: string;
  workflowStatus?: WorkflowStatus;
  pendingRequest?: IContentChangeRequest | null;
  lastRejectedRequest?: IContentChangeRequest | null;
  changeRequestId?: string;
}

export interface IGalleryImage {
  id: string;
  banner: IGallery;
  bannerId: string;
  media: IMedia;
  mediaId: string;
  order: number;
  caption: string;
  link: string | null;
  createdAt: string;
  updatedAt: string;
}
