/*
  Warnings:

  - You are about to drop the `Thumbnail` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `averageRating` on the `ImageStats` table. All the data in the column will be lost.
  - You are about to drop the column `downloadCount` on the `ImageStats` table. All the data in the column will be lost.
  - You are about to drop the column `lastDownloaded` on the `ImageStats` table. All the data in the column will be lost.
  - You are about to drop the column `viewCount` on the `ImageStats` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Image" ADD COLUMN "thumbnail" TEXT;
ALTER TABLE "Image" ADD COLUMN "thumbnailError" TEXT;
ALTER TABLE "Image" ADD COLUMN "thumbnailErrorAt" DATETIME;
ALTER TABLE "Image" ADD COLUMN "thumbnailSize" INTEGER;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Thumbnail";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ImageStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "lastViewed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ImageStats_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ImageStats" ("createdAt", "id", "imageId", "lastViewed", "updatedAt") SELECT "createdAt", "id", "imageId", coalesce("lastViewed", CURRENT_TIMESTAMP) AS "lastViewed", "updatedAt" FROM "ImageStats";
DROP TABLE "ImageStats";
ALTER TABLE "new_ImageStats" RENAME TO "ImageStats";
CREATE UNIQUE INDEX "ImageStats_imageId_key" ON "ImageStats"("imageId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
