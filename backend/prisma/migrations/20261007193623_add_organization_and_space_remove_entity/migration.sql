/*
  Warnings:

  - You are about to drop the column `entityId` on the `article` table. All the data in the column will be lost.
  - You are about to drop the column `entityId` on the `gallery` table. All the data in the column will be lost.
  - You are about to drop the column `entityId` on the `page` table. All the data in the column will be lost.
  - You are about to drop the column `entityId` on the `popup` table. All the data in the column will be lost.
  - You are about to drop the column `entityId` on the `service` table. All the data in the column will be lost.
  - You are about to drop the column `entityId` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `entity` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[spaceId,slug]` on the table `page` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "OrganizationTypes" AS ENUM ('secretaria', 'divisão', 'seção', 'conselho', 'projeto');

-- DropForeignKey
ALTER TABLE "article" DROP CONSTRAINT "article_entityId_fkey";

-- DropForeignKey
ALTER TABLE "gallery" DROP CONSTRAINT "gallery_entityId_fkey";

-- DropForeignKey
ALTER TABLE "page" DROP CONSTRAINT "page_entityId_fkey";

-- DropForeignKey
ALTER TABLE "popup" DROP CONSTRAINT "popup_entityId_fkey";

-- DropForeignKey
ALTER TABLE "service" DROP CONSTRAINT "service_entityId_fkey";

-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_entityId_fkey";

-- DropIndex
DROP INDEX "gallery_entityId_active_idx";

-- DropIndex
DROP INDEX "page_entityId_slug_key";

-- DropIndex
DROP INDEX "popup_entityId_active_status_publicationDate_expirationDate_idx";

-- AlterTable
ALTER TABLE "article" DROP COLUMN "entityId",
ADD COLUMN     "organizationId" UUID;

-- AlterTable
ALTER TABLE "gallery" DROP COLUMN "entityId",
ADD COLUMN     "organizationId" UUID,
ADD COLUMN     "spaceId" UUID;

-- AlterTable
ALTER TABLE "page" DROP COLUMN "entityId",
ADD COLUMN     "organizationId" UUID,
ADD COLUMN     "spaceId" UUID;

-- AlterTable
ALTER TABLE "popup" DROP COLUMN "entityId",
ADD COLUMN     "organizationId" UUID,
ADD COLUMN     "spaceId" UUID;

-- AlterTable
ALTER TABLE "service" DROP COLUMN "entityId",
ADD COLUMN     "organizationId" UUID;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "entityId",
ADD COLUMN     "organizationId" UUID;

-- DropTable
DROP TABLE "entity";

-- CreateTable
CREATE TABLE "organization" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "acronym" TEXT,
    "type" "OrganizationTypes" NOT NULL DEFAULT 'secretaria',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "parentId" UUID,
    "defaultSpaceId" UUID,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "space" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "space_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parentId" UUID,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ArticleCategories" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_ArticleCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "space_slug_key" ON "space"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "category_slug_key" ON "category"("slug");

-- CreateIndex
CREATE INDEX "_ArticleCategories_B_index" ON "_ArticleCategories"("B");

-- CreateIndex
CREATE INDEX "gallery_organizationId_active_idx" ON "gallery"("organizationId", "active");

-- CreateIndex
CREATE INDEX "gallery_spaceId_active_idx" ON "gallery"("spaceId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "page_spaceId_slug_key" ON "page"("spaceId", "slug");

-- CreateIndex
CREATE INDEX "popup_organizationId_active_status_idx" ON "popup"("organizationId", "active", "status");

-- CreateIndex
CREATE INDEX "popup_spaceId_active_status_idx" ON "popup"("spaceId", "active", "status");

-- AddForeignKey
ALTER TABLE "organization" ADD CONSTRAINT "organization_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization" ADD CONSTRAINT "organization_defaultSpaceId_fkey" FOREIGN KEY ("defaultSpaceId") REFERENCES "space"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page" ADD CONSTRAINT "page_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "space"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page" ADD CONSTRAINT "page_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article" ADD CONSTRAINT "article_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery" ADD CONSTRAINT "gallery_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "space"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery" ADD CONSTRAINT "gallery_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "popup" ADD CONSTRAINT "popup_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "space"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "popup" ADD CONSTRAINT "popup_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service" ADD CONSTRAINT "service_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArticleCategories" ADD CONSTRAINT "_ArticleCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArticleCategories" ADD CONSTRAINT "_ArticleCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
