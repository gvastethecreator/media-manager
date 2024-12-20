/*
  Warnings:

  - You are about to drop the column `lastIndexed` on the `Folder` table. All the data in the column will be lost.
  - You are about to drop the column `parentId` on the `Folder` table. All the data in the column will be lost.
  - You are about to drop the column `totalFiles` on the `Folder` table. All the data in the column will be lost.
  - You are about to drop the column `totalSize` on the `Folder` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnailSize` on the `Image` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Collection` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '👤',
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "theme" TEXT NOT NULL DEFAULT 'system',
    "language" TEXT NOT NULL DEFAULT 'es',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Folder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "isWatched" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Folder" ("createdAt", "id", "isWatched", "name", "path", "updatedAt") SELECT "createdAt", "id", "isWatched", "name", "path", "updatedAt" FROM "Folder";
DROP TABLE "Folder";
ALTER TABLE "new_Folder" RENAME TO "Folder";
CREATE UNIQUE INDEX "Folder_path_key" ON "Folder"("path");
CREATE TABLE "new_Image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,
    "metadata" TEXT,
    "thumbnail" TEXT,
    "folderId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Image_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Image" ("createdAt", "folderId", "hash", "id", "metadata", "name", "path", "size", "thumbnail", "updatedAt") SELECT "createdAt", "folderId", "hash", "id", "metadata", "name", "path", "size", "thumbnail", "updatedAt" FROM "Image";
DROP TABLE "Image";
ALTER TABLE "new_Image" RENAME TO "Image";
CREATE UNIQUE INDEX "Image_path_key" ON "Image"("path");
CREATE UNIQUE INDEX "Image_hash_key" ON "Image"("hash");
CREATE INDEX "Image_folderId_idx" ON "Image"("folderId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Collection_name_key" ON "Collection"("name");
