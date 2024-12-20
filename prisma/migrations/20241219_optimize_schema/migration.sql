-- CreateIndex
CREATE INDEX "Folder_path_idx" ON "Folder"("path");
CREATE INDEX "Folder_isWatched_idx" ON "Folder"("isWatched");

-- CreateIndex
CREATE INDEX "Image_hash_idx" ON "Image"("hash");
CREATE INDEX "Image_name_idx" ON "Image"("name");

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN "normalizedName" TEXT;
UPDATE "Tag" SET "normalizedName" = lower(replace(name, ' ', '_'));
CREATE UNIQUE INDEX "Tag_normalizedName_key" ON "Tag"("normalizedName");
CREATE INDEX "Tag_normalizedName_idx" ON "Tag"("normalizedName");

-- AlterTable
ALTER TABLE "Collection" ADD COLUMN "parentId" TEXT REFERENCES "Collection"("id");
CREATE INDEX "Collection_parentId_idx" ON "Collection"("parentId");

-- CreateTable
CREATE TABLE "QueueJob" (
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
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "QueueJob_queue_status_idx" ON "QueueJob"("queue", "status");
CREATE INDEX "QueueJob_status_createdAt_idx" ON "QueueJob"("status", "createdAt");
