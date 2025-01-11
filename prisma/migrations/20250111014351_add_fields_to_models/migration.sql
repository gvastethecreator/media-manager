/*
  Warnings:

  - You are about to drop the column `characterId` on the `Image` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '👤',
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "description" TEXT,
    "shortcut" TEXT,
    "sortBy" TEXT NOT NULL DEFAULT 'name',
    "filters" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Character" ("color", "createdAt", "description", "emoji", "filters", "id", "name", "sortBy", "updatedAt") SELECT coalesce("color", '#3b82f6') AS "color", "createdAt", "description", coalesce("emoji", '👤') AS "emoji", coalesce("filters", '[]') AS "filters", "id", "name", coalesce("sortBy", 'name') AS "sortBy", "updatedAt" FROM "Character";
DROP TABLE "Character";
ALTER TABLE "new_Character" RENAME TO "Character";
CREATE UNIQUE INDEX "Character_name_key" ON "Character"("name");
CREATE INDEX "Character_name_idx" ON "Character"("name");
CREATE INDEX "Character_createdAt_idx" ON "Character"("createdAt");
CREATE TABLE "new_Image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "metadata" TEXT,
    "thumbnail" BLOB,
    "thumbnailSize" INTEGER,
    "thumbnailWidth" INTEGER,
    "thumbnailHeight" INTEGER,
    "thumbnailError" TEXT,
    "thumbnailErrorAt" DATETIME,
    "thumbnailOptimizedAt" DATETIME,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "folderId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Image_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Image" ("createdAt", "folderId", "hash", "height", "id", "isFavorite", "isPublic", "metadata", "name", "path", "size", "thumbnail", "thumbnailError", "thumbnailErrorAt", "thumbnailHeight", "thumbnailOptimizedAt", "thumbnailSize", "thumbnailWidth", "updatedAt", "width") SELECT "createdAt", "folderId", "hash", "height", "id", "isFavorite", "isPublic", "metadata", "name", "path", "size", "thumbnail", "thumbnailError", "thumbnailErrorAt", "thumbnailHeight", "thumbnailOptimizedAt", "thumbnailSize", "thumbnailWidth", "updatedAt", "width" FROM "Image";
DROP TABLE "Image";
ALTER TABLE "new_Image" RENAME TO "Image";
CREATE INDEX "Image_folderId_idx" ON "Image"("folderId");
CREATE INDEX "Image_hash_idx" ON "Image"("hash");
CREATE INDEX "Image_createdAt_idx" ON "Image"("createdAt");
CREATE INDEX "Image_updatedAt_idx" ON "Image"("updatedAt");
CREATE INDEX "Image_isPublic_idx" ON "Image"("isPublic");
CREATE INDEX "Image_isFavorite_idx" ON "Image"("isFavorite");
CREATE UNIQUE INDEX "Image_path_folderId_key" ON "Image"("path", "folderId");
CREATE TABLE "new_Object" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🎯',
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "description" TEXT,
    "shortcut" TEXT,
    "sortBy" TEXT NOT NULL DEFAULT 'name',
    "filters" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Object" ("createdAt", "description", "id", "name", "updatedAt") SELECT "createdAt", "description", "id", "name", "updatedAt" FROM "Object";
DROP TABLE "Object";
ALTER TABLE "new_Object" RENAME TO "Object";
CREATE UNIQUE INDEX "Object_name_key" ON "Object"("name");
CREATE INDEX "Object_name_idx" ON "Object"("name");
CREATE INDEX "Object_createdAt_idx" ON "Object"("createdAt");
CREATE TABLE "new_Place" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '📍',
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "description" TEXT,
    "shortcut" TEXT,
    "sortBy" TEXT NOT NULL DEFAULT 'name',
    "filters" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Place" ("createdAt", "description", "id", "name", "updatedAt") SELECT "createdAt", "description", "id", "name", "updatedAt" FROM "Place";
DROP TABLE "Place";
ALTER TABLE "new_Place" RENAME TO "Place";
CREATE UNIQUE INDEX "Place_name_key" ON "Place"("name");
CREATE INDEX "Place_name_idx" ON "Place"("name");
CREATE INDEX "Place_createdAt_idx" ON "Place"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
