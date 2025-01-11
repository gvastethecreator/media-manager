-- DropIndex
DROP INDEX "Character_name_idx";

-- AlterTable
ALTER TABLE "Character" ADD COLUMN "color" TEXT;
ALTER TABLE "Character" ADD COLUMN "emoji" TEXT;
ALTER TABLE "Character" ADD COLUMN "filters" TEXT DEFAULT '[]';
ALTER TABLE "Character" ADD COLUMN "sortBy" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "characterId" TEXT,
    CONSTRAINT "Image_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Image_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
