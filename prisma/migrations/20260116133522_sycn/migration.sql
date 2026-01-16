/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `mediaType` on table `Notice` required. This step will fail if there are existing NULL values in that column.
  - Made the column `accent` on table `Notice` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `Notice` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `Notice` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Notice" ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "mediaType" SET NOT NULL,
ALTER COLUMN "mediaType" SET DEFAULT 'none',
ALTER COLUMN "accent" SET NOT NULL,
ALTER COLUMN "accent" SET DEFAULT 'bg-blue-600',
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "updatedAt" SET NOT NULL;

-- DropTable
DROP TABLE "User";
