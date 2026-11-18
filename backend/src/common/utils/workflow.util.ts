import { UserRole } from '../../generated/prisma/enums';

export interface RequestUserContext {
  id?: string;
  role?: UserRole;
  organizationId?: string | null;
}

export interface PendingWorkflowAction {
  type: 'update' | 'delete';
  data?: Record<string, any>;
  requestedAt: string;
}

export function extractRequestUser(req: any): RequestUserContext {
  return {
    id: req?.user?.id || req?.session?.user?.id || req?.session?.passport?.user,
    role: req?.user?.role || req?.session?.user?.role,
    organizationId:
      req?.user?.organizationId ?? req?.session?.user?.organizationId ?? null,
  };
}
