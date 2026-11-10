export interface IAuditLog {
  id: string;
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: any;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string | null;
  } | null;
}

export interface IAuditLogsResponse {
  data: IAuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IAuditFilterParams {
  page?: number;
  limit?: number;
  action?: string;
  entity?: string;
  userId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

