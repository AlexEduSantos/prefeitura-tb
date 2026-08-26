/*
  Warnings:

  - You are about to drop the `Menu` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MenuItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Menu" DROP CONSTRAINT "Menu_entityId_fkey";

-- DropForeignKey
ALTER TABLE "MenuItem" DROP CONSTRAINT "MenuItem_entityId_fkey";

-- DropForeignKey
ALTER TABLE "MenuItem" DROP CONSTRAINT "MenuItem_menuId_fkey";

-- DropForeignKey
ALTER TABLE "MenuItem" DROP CONSTRAINT "MenuItem_pageId_fkey";

-- DropForeignKey
ALTER TABLE "MenuItem" DROP CONSTRAINT "MenuItem_parentId_fkey";

-- DropTable
DROP TABLE "Menu";

-- DropTable
DROP TABLE "MenuItem";
