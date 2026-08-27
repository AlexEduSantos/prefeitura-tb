-- AlterEnum
ALTER TYPE "PopupStatus" ADD VALUE 'agendado';

-- AlterTable
ALTER TABLE "Popups" ALTER COLUMN "priority" SET DEFAULT 10;
