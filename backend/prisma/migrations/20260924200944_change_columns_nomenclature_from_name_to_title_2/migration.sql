/*
  Warnings:

  - You are about to drop the column `name` on the `entity` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `folder` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `Article` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Galleries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GalleryMedia` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Media` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Page` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Popups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Services` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Stories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StoriesItem` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `title` to the `entity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `folder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Article" DROP CONSTRAINT "Article_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Article" DROP CONSTRAINT "Article_coverId_fkey";

-- DropForeignKey
ALTER TABLE "Article" DROP CONSTRAINT "Article_editorId_fkey";

-- DropForeignKey
ALTER TABLE "Article" DROP CONSTRAINT "Article_entityId_fkey";

-- DropForeignKey
ALTER TABLE "Article" DROP CONSTRAINT "Article_galleryId_fkey";

-- DropForeignKey
ALTER TABLE "Galleries" DROP CONSTRAINT "Galleries_entityId_fkey";

-- DropForeignKey
ALTER TABLE "Galleries" DROP CONSTRAINT "Galleries_userId_fkey";

-- DropForeignKey
ALTER TABLE "GalleryMedia" DROP CONSTRAINT "GalleryMedia_galleryId_fkey";

-- DropForeignKey
ALTER TABLE "GalleryMedia" DROP CONSTRAINT "GalleryMedia_mediaId_fkey";

-- DropForeignKey
ALTER TABLE "Media" DROP CONSTRAINT "Media_folderId_fkey";

-- DropForeignKey
ALTER TABLE "Page" DROP CONSTRAINT "Page_entityId_fkey";

-- DropForeignKey
ALTER TABLE "Page" DROP CONSTRAINT "Page_userId_fkey";

-- DropForeignKey
ALTER TABLE "Popups" DROP CONSTRAINT "Popups_entityId_fkey";

-- DropForeignKey
ALTER TABLE "Popups" DROP CONSTRAINT "Popups_imageId_fkey";

-- DropForeignKey
ALTER TABLE "Popups" DROP CONSTRAINT "Popups_userId_fkey";

-- DropForeignKey
ALTER TABLE "Services" DROP CONSTRAINT "Services_entityId_fkey";

-- DropForeignKey
ALTER TABLE "Services" DROP CONSTRAINT "Services_imageId_fkey";

-- DropForeignKey
ALTER TABLE "Services" DROP CONSTRAINT "Services_userId_fkey";

-- DropForeignKey
ALTER TABLE "Stories" DROP CONSTRAINT "Stories_coverId_fkey";

-- DropForeignKey
ALTER TABLE "StoriesItem" DROP CONSTRAINT "StoriesItem_mediaId_fkey";

-- DropForeignKey
ALTER TABLE "StoriesItem" DROP CONSTRAINT "StoriesItem_storyId_fkey";

-- AlterTable
ALTER TABLE "entity" DROP COLUMN "name",
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "folder" DROP COLUMN "name",
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "name",
ADD COLUMN     "title" TEXT NOT NULL;

-- DropTable
DROP TABLE "Article";

-- DropTable
DROP TABLE "Galleries";

-- DropTable
DROP TABLE "GalleryMedia";

-- DropTable
DROP TABLE "Media";

-- DropTable
DROP TABLE "Page";

-- DropTable
DROP TABLE "Popups";

-- DropTable
DROP TABLE "Services";

-- DropTable
DROP TABLE "Stories";

-- DropTable
DROP TABLE "StoriesItem";

-- CreateTable
CREATE TABLE "page" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "entityId" UUID NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "headline" VARCHAR(500),
    "body" JSONB NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'article',
    "status" "ArticleStatus" NOT NULL DEFAULT 'rascunho',
    "publicationDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "allowComments" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT[],
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "galleryId" UUID,
    "socialPreviewTitle" TEXT,
    "socialPreviewImage" TEXT,
    "socialPreviewDescription" TEXT,
    "authorId" UUID NOT NULL,
    "editorId" UUID,
    "entityId" UUID NOT NULL,
    "coverId" UUID NOT NULL,

    CONSTRAINT "article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "altText" TEXT,
    "description" VARCHAR(1000),
    "type" TEXT NOT NULL,
    "key" TEXT,
    "url" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "tags" TEXT[],
    "status" "MediaStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "folderId" UUID,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "galleryType" "GalleryType" NOT NULL DEFAULT 'slider',
    "galleryAutoplay" BOOLEAN NOT NULL DEFAULT true,
    "galleryInterval" INTEGER NOT NULL DEFAULT 5000,
    "galleryShowThumbnails" BOOLEAN NOT NULL DEFAULT true,
    "entityId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "gallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_media" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order" INTEGER NOT NULL DEFAULT 0,
    "caption" TEXT,
    "link" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "galleryId" UUID NOT NULL,
    "mediaId" UUID NOT NULL,

    CONSTRAINT "gallery_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "popup" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "link" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "displayTime" INTEGER NOT NULL DEFAULT 5,
    "status" "PopupStatus" NOT NULL DEFAULT 'rascunho',
    "type" "PopupType" NOT NULL DEFAULT 'modal',
    "position" TEXT,
    "closeButton" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 10,
    "publicationDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "imageId" UUID NOT NULL,
    "entityId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "popup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "altText" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "description" VARCHAR(1000),
    "entityId" UUID NOT NULL,
    "imageId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "coverId" UUID NOT NULL,

    CONSTRAINT "story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_item" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order" INTEGER NOT NULL DEFAULT 0,
    "caption" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "publishedDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "storyId" UUID NOT NULL,
    "mediaId" UUID NOT NULL,

    CONSTRAINT "story_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "page_entityId_slug_key" ON "page"("entityId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "article_slug_key" ON "article"("slug");

-- CreateIndex
CREATE INDEX "gallery_entityId_active_idx" ON "gallery"("entityId", "active");

-- CreateIndex
CREATE INDEX "gallery_media_galleryId_idx" ON "gallery_media"("galleryId");

-- CreateIndex
CREATE UNIQUE INDEX "gallery_media_galleryId_order_key" ON "gallery_media"("galleryId", "order");

-- CreateIndex
CREATE INDEX "popup_entityId_active_status_publicationDate_expirationDate_idx" ON "popup"("entityId", "active", "status", "publicationDate", "expirationDate");

-- CreateIndex
CREATE UNIQUE INDEX "service_link_key" ON "service"("link");

-- CreateIndex
CREATE UNIQUE INDEX "story_item_storyId_order_key" ON "story_item"("storyId", "order");

-- AddForeignKey
ALTER TABLE "page" ADD CONSTRAINT "page_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page" ADD CONSTRAINT "page_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article" ADD CONSTRAINT "article_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "gallery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article" ADD CONSTRAINT "article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article" ADD CONSTRAINT "article_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article" ADD CONSTRAINT "article_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article" ADD CONSTRAINT "article_coverId_fkey" FOREIGN KEY ("coverId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery" ADD CONSTRAINT "gallery_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery" ADD CONSTRAINT "gallery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_media" ADD CONSTRAINT "gallery_media_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "gallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_media" ADD CONSTRAINT "gallery_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "popup" ADD CONSTRAINT "popup_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "popup" ADD CONSTRAINT "popup_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "popup" ADD CONSTRAINT "popup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service" ADD CONSTRAINT "service_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service" ADD CONSTRAINT "service_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service" ADD CONSTRAINT "service_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story" ADD CONSTRAINT "story_coverId_fkey" FOREIGN KEY ("coverId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_item" ADD CONSTRAINT "story_item_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_item" ADD CONSTRAINT "story_item_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
