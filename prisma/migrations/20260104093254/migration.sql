/*
  Warnings:

  - You are about to drop the column `textAccent` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `height` on the `GalleryItem` table. All the data in the column will be lost.
  - You are about to drop the column `poster` on the `GalleryItem` table. All the data in the column will be lost.
  - You are about to drop the column `src` on the `GalleryItem` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `GalleryItem` table. All the data in the column will be lost.
  - You are about to drop the column `width` on the `GalleryItem` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `GalleryItem` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageUrl` to the `GalleryItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `GalleryItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Made the column `accent` on table `Post` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "textAccent",
DROP COLUMN "time",
ADD COLUMN     "image" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "category" DROP NOT NULL,
ALTER COLUMN "accent" SET DEFAULT 'bg-blue-600';

-- AlterTable
ALTER TABLE "GalleryItem" DROP COLUMN "height",
DROP COLUMN "poster",
DROP COLUMN "src",
DROP COLUMN "type",
DROP COLUMN "width",
DROP COLUMN "year",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "imageUrl" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "category" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Notice" ADD COLUMN     "updatedAt" TIMESTAMP(3),
ALTER COLUMN "mediaType" DROP NOT NULL,
ALTER COLUMN "accent" DROP NOT NULL,
ALTER COLUMN "createdAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "content" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "excerpt" DROP NOT NULL,
ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "readTime" DROP NOT NULL,
ALTER COLUMN "category" DROP NOT NULL,
ALTER COLUMN "image" DROP NOT NULL,
ALTER COLUMN "accent" SET NOT NULL;
