DO $$
BEGIN
  CREATE TYPE "RequestStatus" AS ENUM ('pendente', 'aprovado', 'rejeitado', 'cancelado');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE TYPE "RequestType" AS ENUM ('create', 'update', 'delete');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "content_change_request" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "entityType" TEXT NOT NULL,
  "entityId" UUID,
  "requestType" "RequestType" NOT NULL DEFAULT 'update',
  "proposedData" JSONB,
  "status" "RequestStatus" NOT NULL DEFAULT 'pendente',
  "rejectionReason" TEXT,
  "requestedById" UUID NOT NULL,
  "reviewedById" UUID,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "appliedData" JSONB,

  CONSTRAINT "content_change_request_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "content_change_request_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "content_change_request_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "content_change_request_entityType_entityId_idx" ON "content_change_request"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "content_change_request_status_createdAt_idx" ON "content_change_request"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "content_change_request_requestedById_idx" ON "content_change_request"("requestedById");

ALTER TABLE "page"
  DROP COLUMN IF EXISTS "workflowStatus",
  DROP COLUMN IF EXISTS "pendingAction",
  DROP COLUMN IF EXISTS "approvedById",
  DROP COLUMN IF EXISTS "approvedAt";

ALTER TABLE "article"
  DROP COLUMN IF EXISTS "workflowStatus",
  DROP COLUMN IF EXISTS "pendingAction",
  DROP COLUMN IF EXISTS "approvedById",
  DROP COLUMN IF EXISTS "approvedAt";

ALTER TABLE "gallery"
  DROP COLUMN IF EXISTS "workflowStatus",
  DROP COLUMN IF EXISTS "pendingAction",
  DROP COLUMN IF EXISTS "approvedById",
  DROP COLUMN IF EXISTS "approvedAt";

ALTER TABLE "popup"
  DROP COLUMN IF EXISTS "workflowStatus",
  DROP COLUMN IF EXISTS "pendingAction",
  DROP COLUMN IF EXISTS "approvedById",
  DROP COLUMN IF EXISTS "approvedAt";

ALTER TABLE "service"
  DROP COLUMN IF EXISTS "workflowStatus",
  DROP COLUMN IF EXISTS "pendingAction",
  DROP COLUMN IF EXISTS "approvedById",
  DROP COLUMN IF EXISTS "approvedAt";
