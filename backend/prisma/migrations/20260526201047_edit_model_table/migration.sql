-- AlterTable
ALTER TABLE "Article" ALTER COLUMN "type" SET DEFAULT 'article';

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "key" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ALTER COLUMN "url" DROP NOT NULL;
