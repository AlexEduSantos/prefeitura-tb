-- CreateTable
CREATE TABLE "official_gazette" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "edition" TEXT,
    "description" TEXT,
    "publicationDate" DATE NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "pageCount" INTEGER,
    "createdById" UUID NOT NULL,
    "updatedById" UUID,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "official_gazette_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "official_gazette_publicationDate_idx" ON "official_gazette"("publicationDate" DESC);

-- CreateIndex
CREATE INDEX "official_gazette_title_idx" ON "official_gazette"("title");

-- AddForeignKey
ALTER TABLE "official_gazette" ADD CONSTRAINT "official_gazette_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_gazette" ADD CONSTRAINT "official_gazette_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
