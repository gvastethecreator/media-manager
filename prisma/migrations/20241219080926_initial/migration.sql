-- CreateTable
CREATE TABLE "Folder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "path" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "isWatched" BOOLEAN NOT NULL DEFAULT false,
    "lastIndexed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalFiles" INTEGER NOT NULL DEFAULT 0,
    "totalSize" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Folder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Folder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "path" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "metadata" TEXT DEFAULT '{}',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "folderId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Image_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Thumbnail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "size" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "quality" INTEGER NOT NULL DEFAULT 80,
    "format" TEXT NOT NULL DEFAULT 'webp',
    "imageId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Thumbnail_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT,
    "description" TEXT,
    "type" TEXT,
    "metadata" TEXT DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "color" TEXT DEFAULT '#94a3b8',
    "emoji" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imageId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImageStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "averageRating" REAL,
    "lastViewed" DATETIME,
    "lastDownloaded" DATETIME,
    "imageId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ImageStats_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ImageToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ImageToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ImageToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CollectionToImage" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CollectionToImage_A_fkey" FOREIGN KEY ("A") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CollectionToImage_B_fkey" FOREIGN KEY ("B") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Folder_path_key" ON "Folder"("path");

-- CreateIndex
CREATE UNIQUE INDEX "Image_path_key" ON "Image"("path");

-- CreateIndex
CREATE UNIQUE INDEX "Image_hash_key" ON "Image"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ImageStats_imageId_key" ON "ImageStats"("imageId");

-- CreateIndex
CREATE UNIQUE INDEX "_ImageToTag_AB_unique" ON "_ImageToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_ImageToTag_B_index" ON "_ImageToTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CollectionToImage_AB_unique" ON "_CollectionToImage"("A", "B");

-- CreateIndex
CREATE INDEX "_CollectionToImage_B_index" ON "_CollectionToImage"("B");
