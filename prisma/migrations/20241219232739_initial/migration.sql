/*
  Warnings:

  - You are about to drop the `_ImageToTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `coverImage` on the `Collection` table. All the data in the column will be lost.
  - You are about to drop the column `isPublic` on the `Collection` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `Collection` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `height` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `isPublic` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnailError` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnailErrorAt` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `width` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `Tag` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `Tag` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Tag` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "_ImageToTag_B_index";

-- DropIndex
DROP INDEX "_ImageToTag_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_ImageToTag";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "_TagToImage" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_TagToImage_A_fkey" FOREIGN KEY ("A") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TagToImage_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Collection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🌟',
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "shortcut" TEXT,
    "sortBy" TEXT NOT NULL DEFAULT 'name',
    "filters" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Collection" ("color", "createdAt", "description", "emoji", "id", "name", "updatedAt") SELECT coalesce("color", '#3b82f6') AS "color", "createdAt", "description", coalesce("emoji", '🌟') AS "emoji", "id", "name", "updatedAt" FROM "Collection";
DROP TABLE "Collection";
ALTER TABLE "new_Collection" RENAME TO "Collection";
CREATE INDEX "Collection_name_idx" ON "Collection"("name");
CREATE TABLE "new_Image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "path" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,
    "metadata" TEXT,
    "thumbnail" TEXT,
    "thumbnailSize" INTEGER,
    "folderId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Image_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Image" ("createdAt", "folderId", "hash", "id", "metadata", "name", "path", "size", "thumbnail", "thumbnailSize", "updatedAt") SELECT "createdAt", "folderId", "hash", "id", "metadata", "name", "path", "size", "thumbnail", "thumbnailSize", "updatedAt" FROM "Image";
DROP TABLE "Image";
ALTER TABLE "new_Image" RENAME TO "Image";
CREATE UNIQUE INDEX "Image_path_key" ON "Image"("path");
CREATE UNIQUE INDEX "Image_hash_key" ON "Image"("hash");
CREATE INDEX "Image_folderId_idx" ON "Image"("folderId");
CREATE TABLE "new_Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "description" TEXT,
    "shortcut" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Tag" ("color", "createdAt", "description", "id", "name", "updatedAt") SELECT coalesce("color", '#3b82f6') AS "color", "createdAt", "description", "id", "name", "updatedAt" FROM "Tag";
DROP TABLE "Tag";
ALTER TABLE "new_Tag" RENAME TO "Tag";
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");
CREATE INDEX "Tag_name_idx" ON "Tag"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_TagToImage_AB_unique" ON "_TagToImage"("A", "B");

-- CreateIndex
CREATE INDEX "_TagToImage_B_index" ON "_TagToImage"("B");

-- CreateIndex
CREATE INDEX "Favorite_imageId_idx" ON "Favorite"("imageId");

-- CreateIndex
CREATE INDEX "ImageStats_imageId_idx" ON "ImageStats"("imageId");
