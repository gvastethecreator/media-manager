-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,
    "metadata" TEXT,
    "thumbnail" TEXT,
    "thumbnailSize" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "folderId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Image_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Image" ("createdAt", "folderId", "hash", "id", "metadata", "name", "path", "size", "thumbnail", "updatedAt") SELECT "createdAt", "folderId", "hash", "id", "metadata", "name", "path", "size", "thumbnail", "updatedAt" FROM "Image";
DROP TABLE "Image";
ALTER TABLE "new_Image" RENAME TO "Image";
CREATE UNIQUE INDEX "Image_path_key" ON "Image"("path");
CREATE UNIQUE INDEX "Image_hash_key" ON "Image"("hash");
CREATE INDEX "Image_folderId_idx" ON "Image"("folderId");
CREATE INDEX "Image_hash_idx" ON "Image"("hash");
CREATE INDEX "Image_name_idx" ON "Image"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
