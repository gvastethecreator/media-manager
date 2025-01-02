/*
  Warnings:

  - You are about to drop the `_CollectionToImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_TagToImage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "_CollectionToImage_B_index";

-- DropIndex
DROP INDEX "_CollectionToImage_AB_unique";

-- DropIndex
DROP INDEX "_TagToImage_B_index";

-- DropIndex
DROP INDEX "_TagToImage_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_CollectionToImage";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_TagToImage";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "_ImageToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ImageToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ImageToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ImageToCollection" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ImageToCollection_A_fkey" FOREIGN KEY ("A") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ImageToCollection_B_fkey" FOREIGN KEY ("B") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "folderId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Image_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Image" ("createdAt", "folderId", "hash", "height", "id", "isPublic", "metadata", "name", "path", "size", "thumbnail", "thumbnailHeight", "thumbnailSize", "thumbnailWidth", "updatedAt", "width") SELECT "createdAt", "folderId", "hash", "height", "id", "isPublic", "metadata", "name", "path", "size", "thumbnail", "thumbnailHeight", "thumbnailSize", "thumbnailWidth", "updatedAt", "width" FROM "Image";
DROP TABLE "Image";
ALTER TABLE "new_Image" RENAME TO "Image";
CREATE INDEX "Image_folderId_idx" ON "Image"("folderId");
CREATE INDEX "Image_hash_idx" ON "Image"("hash");
CREATE UNIQUE INDEX "Image_path_folderId_key" ON "Image"("path", "folderId");
CREATE TABLE "new_QueueJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "queue" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,
    "retryAt" DATETIME
);
INSERT INTO "new_QueueJob" ("attempts", "createdAt", "data", "error", "finishedAt", "id", "maxAttempts", "progress", "queue", "startedAt", "status", "updatedAt") SELECT "attempts", "createdAt", "data", "error", "finishedAt", "id", "maxAttempts", "progress", "queue", "startedAt", "status", "updatedAt" FROM "QueueJob";
DROP TABLE "QueueJob";
ALTER TABLE "new_QueueJob" RENAME TO "QueueJob";
CREATE INDEX "QueueJob_queue_status_idx" ON "QueueJob"("queue", "status");
CREATE INDEX "QueueJob_status_createdAt_idx" ON "QueueJob"("status", "createdAt");
CREATE INDEX "QueueJob_priority_status_createdAt_idx" ON "QueueJob"("priority", "status", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_ImageToTag_AB_unique" ON "_ImageToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_ImageToTag_B_index" ON "_ImageToTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ImageToCollection_AB_unique" ON "_ImageToCollection"("A", "B");

-- CreateIndex
CREATE INDEX "_ImageToCollection_B_index" ON "_ImageToCollection"("B");
