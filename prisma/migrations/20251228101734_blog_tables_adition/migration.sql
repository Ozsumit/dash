-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "accent" TEXT DEFAULT 'bg-blue-600',
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trending" BOOLEAN NOT NULL DEFAULT false;
