export type RequestStatus = "pendente" | "aprovado" | "rejeitado" | "cancelado";

export type RequestType = "create" | "update" | "delete";

export type WorkflowStatus = "pendente" | "aprovado" | "rejeitado" | "rascunho";

export interface IApprovalUserRef {
  id: string;
  name: string;
  email?: string;
  avatar?: string | null;
  role?: string;
}

export interface IContentChangeRequest {
  id: string;
  entityType: string;
  entityId: string | null;
  requestType: RequestType;
  proposedData: Record<string, unknown> | null;
  appliedData?: Record<string, unknown> | null;
  status: RequestStatus;
  rejectionReason?: string | null;
  requestedById: string;
  requestedBy?: IApprovalUserRef | null;
  reviewedById?: string | null;
  reviewedBy?: IApprovalUserRef | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  currentEntity?: Record<string, unknown> | null;
}

export interface IApprovalSummary {
  pendente: number;
  rejeitado: number;
  aprovado: number;
}

export interface IApprovalListResponse {
  items: IContentChangeRequest[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: IApprovalSummary;
}
