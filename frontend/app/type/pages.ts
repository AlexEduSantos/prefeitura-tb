import { IOrganization, ISpace } from "./organization";
import { IContentChangeRequest, WorkflowStatus } from "./approval";

export interface IPage {
  id: string;
  title: string;
  slug: string;
  content: Record<string, unknown>;
  description?: string;
  published: boolean;
  spaceId?: string | null;
  space?: ISpace | null;
  organizationId?: string | null;
  organization?: IOrganization | null;
  createdAt: Date;
  updatedAt: Date;
  workflowStatus?: WorkflowStatus;
  pendingRequest?: IContentChangeRequest | null;
  lastRejectedRequest?: IContentChangeRequest | null;
  changeRequestId?: string;
}
