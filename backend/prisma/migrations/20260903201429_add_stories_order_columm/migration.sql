/*
  Warnings:

  - You are about to drop the column `alt` on the `Stories` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Stories" DROP COLUMN "alt",
ADD COLUMN     "order" INTEGER DEFAULT 0;
