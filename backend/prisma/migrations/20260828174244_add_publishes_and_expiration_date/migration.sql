/*
  Warnings:

  - Added the required column `expirationDate` to the `StoriesItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publishedDate` to the `StoriesItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StoriesItem" ADD COLUMN     "expirationDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "publishedDate" TIMESTAMP(3) NOT NULL;
