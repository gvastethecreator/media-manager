-- CreateIndex
CREATE INDEX "Collection_createdAt_idx" ON "Collection"("createdAt");

-- CreateIndex
CREATE INDEX "Folder_lastIndexed_idx" ON "Folder"("lastIndexed");

-- CreateIndex
CREATE INDEX "Folder_createdAt_idx" ON "Folder"("createdAt");

-- CreateIndex
CREATE INDEX "Image_createdAt_idx" ON "Image"("createdAt");

-- CreateIndex
CREATE INDEX "Image_updatedAt_idx" ON "Image"("updatedAt");

-- CreateIndex
CREATE INDEX "Image_isPublic_idx" ON "Image"("isPublic");

-- CreateIndex
CREATE INDEX "Image_isFavorite_idx" ON "Image"("isFavorite");

-- CreateIndex
CREATE INDEX "QueueJob_retryAt_idx" ON "QueueJob"("retryAt");

-- CreateIndex
CREATE INDEX "Tag_createdAt_idx" ON "Tag"("createdAt");
