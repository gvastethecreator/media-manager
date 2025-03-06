-- CreateTable
CREATE TABLE "Folder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "totalFiles" INTEGER NOT NULL DEFAULT 0,
    "totalSize" INTEGER NOT NULL DEFAULT 0,
    "lastIndexed" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "featuredImage" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Image" (
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

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🏷️',
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "description" TEXT,
    "shortcut" TEXT,
    "featuredImage" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🌟',
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "shortcut" TEXT,
    "sortBy" TEXT NOT NULL DEFAULT 'name',
    "filters" TEXT NOT NULL DEFAULT '[]',
    "url" TEXT,
    "alternativeUrl" TEXT,
    "sourceImage" TEXT,
    "platform" TEXT,
    "price" REAL,
    "editions" TEXT NOT NULL DEFAULT '[]',
    "featuredImage" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
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
    "imageId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "lastViewed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ImageStats_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '👤',
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "theme" TEXT NOT NULL DEFAULT 'system',
    "language" TEXT NOT NULL DEFAULT 'es',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Album" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '📸',
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "shortcut" TEXT,
    "sortBy" TEXT NOT NULL DEFAULT 'name',
    "filters" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '👤',
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "description" TEXT,
    "shortcut" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "class" TEXT NOT NULL DEFAULT 'unknown',
    "race" TEXT NOT NULL DEFAULT 'unknown',
    "alignment" TEXT NOT NULL DEFAULT 'neutral',
    "backstory" TEXT NOT NULL DEFAULT '',
    "stats" TEXT NOT NULL DEFAULT '{}',
    "sortBy" TEXT NOT NULL DEFAULT 'name',
    "filters" TEXT NOT NULL DEFAULT '[]',
    "psychologicalProfile" TEXT NOT NULL DEFAULT '',
    "socialProfile" TEXT NOT NULL DEFAULT '',
    "relationships" TEXT NOT NULL DEFAULT '[]',
    "goals" TEXT NOT NULL DEFAULT '[]',
    "fears" TEXT NOT NULL DEFAULT '[]',
    "beliefs" TEXT NOT NULL DEFAULT '[]',
    "personality" TEXT NOT NULL DEFAULT '[]',
    "featuredImage" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '📍',
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "description" TEXT,
    "shortcut" TEXT,
    "region" TEXT NOT NULL DEFAULT 'unknown',
    "type" TEXT NOT NULL DEFAULT 'unknown',
    "climate" TEXT NOT NULL DEFAULT 'temperate',
    "population" INTEGER NOT NULL DEFAULT 0,
    "government" TEXT NOT NULL DEFAULT 'unknown',
    "dangers" TEXT NOT NULL DEFAULT '[]',
    "resources" TEXT NOT NULL DEFAULT '[]',
    "lore" TEXT NOT NULL DEFAULT '',
    "history" TEXT NOT NULL DEFAULT '',
    "stats" TEXT NOT NULL DEFAULT '{}',
    "sortBy" TEXT NOT NULL DEFAULT 'name',
    "filters" TEXT NOT NULL DEFAULT '[]',
    "featuredImage" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Object" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🎯',
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "description" TEXT,
    "shortcut" TEXT,
    "type" TEXT NOT NULL DEFAULT 'misc',
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "properties" TEXT NOT NULL DEFAULT '[]',
    "requirements" TEXT NOT NULL DEFAULT '{}',
    "origin" TEXT NOT NULL DEFAULT '',
    "stats" TEXT NOT NULL DEFAULT '{}',
    "sortBy" TEXT NOT NULL DEFAULT 'name',
    "filters" TEXT NOT NULL DEFAULT '[]',
    "featuredImage" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

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
    "updatedAt" DATETIME NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,
    "retryAt" DATETIME
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Activity_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Concept" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '💡',
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "description" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'general',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "featuredImage" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Prompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🎯',
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "description" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'general',
    "parameters" TEXT NOT NULL DEFAULT '{}',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "featuredImage" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'general',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "featuredImage" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Attribute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "value" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'general',
    "description" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "featuredImage" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UniversalFavorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SystemImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'icon',
    "category" TEXT NOT NULL DEFAULT 'system',
    "size" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_ImageToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ImageToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ImageToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ImageToPlace" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ImageToPlace_A_fkey" FOREIGN KEY ("A") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ImageToPlace_B_fkey" FOREIGN KEY ("B") REFERENCES "Place" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ImageToObject" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ImageToObject_A_fkey" FOREIGN KEY ("A") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ImageToObject_B_fkey" FOREIGN KEY ("B") REFERENCES "Object" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ImageToCollection" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ImageToCollection_A_fkey" FOREIGN KEY ("A") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ImageToCollection_B_fkey" FOREIGN KEY ("B") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ImageToAlbum" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ImageToAlbum_A_fkey" FOREIGN KEY ("A") REFERENCES "Album" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ImageToAlbum_B_fkey" FOREIGN KEY ("B") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ImageToCharacter" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ImageToCharacter_A_fkey" FOREIGN KEY ("A") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ImageToCharacter_B_fkey" FOREIGN KEY ("B") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CharacterRelations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CharacterRelations_A_fkey" FOREIGN KEY ("A") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CharacterRelations_B_fkey" FOREIGN KEY ("B") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CharacterToNote" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CharacterToNote_A_fkey" FOREIGN KEY ("A") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CharacterToNote_B_fkey" FOREIGN KEY ("B") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CharacterToConcept" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CharacterToConcept_A_fkey" FOREIGN KEY ("A") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CharacterToConcept_B_fkey" FOREIGN KEY ("B") REFERENCES "Concept" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CharacterToPrompt" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CharacterToPrompt_A_fkey" FOREIGN KEY ("A") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CharacterToPrompt_B_fkey" FOREIGN KEY ("B") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PlaceToPrompt" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PlaceToPrompt_A_fkey" FOREIGN KEY ("A") REFERENCES "Place" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PlaceToPrompt_B_fkey" FOREIGN KEY ("B") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ObjectToPrompt" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ObjectToPrompt_A_fkey" FOREIGN KEY ("A") REFERENCES "Object" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ObjectToPrompt_B_fkey" FOREIGN KEY ("B") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PlaceToConcept" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PlaceToConcept_A_fkey" FOREIGN KEY ("A") REFERENCES "Concept" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PlaceToConcept_B_fkey" FOREIGN KEY ("B") REFERENCES "Place" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ObjectToConcept" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ObjectToConcept_A_fkey" FOREIGN KEY ("A") REFERENCES "Concept" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ObjectToConcept_B_fkey" FOREIGN KEY ("B") REFERENCES "Object" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ConceptToNote" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ConceptToNote_A_fkey" FOREIGN KEY ("A") REFERENCES "Concept" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ConceptToNote_B_fkey" FOREIGN KEY ("B") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ConceptToPrompt" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ConceptToPrompt_A_fkey" FOREIGN KEY ("A") REFERENCES "Concept" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ConceptToPrompt_B_fkey" FOREIGN KEY ("B") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PlaceToNote" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PlaceToNote_A_fkey" FOREIGN KEY ("A") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PlaceToNote_B_fkey" FOREIGN KEY ("B") REFERENCES "Place" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ObjectToNote" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ObjectToNote_A_fkey" FOREIGN KEY ("A") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ObjectToNote_B_fkey" FOREIGN KEY ("B") REFERENCES "Object" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PromptToNote" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PromptToNote_A_fkey" FOREIGN KEY ("A") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PromptToNote_B_fkey" FOREIGN KEY ("B") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CharacterToAttribute" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CharacterToAttribute_A_fkey" FOREIGN KEY ("A") REFERENCES "Attribute" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CharacterToAttribute_B_fkey" FOREIGN KEY ("B") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PlaceToAttribute" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PlaceToAttribute_A_fkey" FOREIGN KEY ("A") REFERENCES "Attribute" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PlaceToAttribute_B_fkey" FOREIGN KEY ("B") REFERENCES "Place" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ObjectToAttribute" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ObjectToAttribute_A_fkey" FOREIGN KEY ("A") REFERENCES "Attribute" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ObjectToAttribute_B_fkey" FOREIGN KEY ("B") REFERENCES "Object" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ConceptToAttribute" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ConceptToAttribute_A_fkey" FOREIGN KEY ("A") REFERENCES "Attribute" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ConceptToAttribute_B_fkey" FOREIGN KEY ("B") REFERENCES "Concept" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PromptToAttribute" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PromptToAttribute_A_fkey" FOREIGN KEY ("A") REFERENCES "Attribute" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PromptToAttribute_B_fkey" FOREIGN KEY ("B") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_NoteToAttribute" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_NoteToAttribute_A_fkey" FOREIGN KEY ("A") REFERENCES "Attribute" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_NoteToAttribute_B_fkey" FOREIGN KEY ("B") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Folder_path_key" ON "Folder"("path");

-- CreateIndex
CREATE INDEX "Folder_path_idx" ON "Folder"("path");

-- CreateIndex
CREATE INDEX "Folder_lastIndexed_idx" ON "Folder"("lastIndexed");

-- CreateIndex
CREATE INDEX "Folder_createdAt_idx" ON "Folder"("createdAt");

-- CreateIndex
CREATE INDEX "Image_folderId_idx" ON "Image"("folderId");

-- CreateIndex
CREATE INDEX "Image_hash_idx" ON "Image"("hash");

-- CreateIndex
CREATE INDEX "Image_createdAt_idx" ON "Image"("createdAt");

-- CreateIndex
CREATE INDEX "Image_updatedAt_idx" ON "Image"("updatedAt");

-- CreateIndex
CREATE INDEX "Image_isPublic_idx" ON "Image"("isPublic");

-- CreateIndex
CREATE INDEX "Image_isFavorite_idx" ON "Image"("isFavorite");

-- CreateIndex
CREATE UNIQUE INDEX "Image_path_folderId_key" ON "Image"("path", "folderId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Tag_createdAt_idx" ON "Tag"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_name_key" ON "Collection"("name");

-- CreateIndex
CREATE INDEX "Collection_name_idx" ON "Collection"("name");

-- CreateIndex
CREATE INDEX "Collection_createdAt_idx" ON "Collection"("createdAt");

-- CreateIndex
CREATE INDEX "Favorite_imageId_idx" ON "Favorite"("imageId");

-- CreateIndex
CREATE UNIQUE INDEX "ImageStats_imageId_key" ON "ImageStats"("imageId");

-- CreateIndex
CREATE INDEX "ImageStats_imageId_idx" ON "ImageStats"("imageId");

-- CreateIndex
CREATE UNIQUE INDEX "Album_name_key" ON "Album"("name");

-- CreateIndex
CREATE INDEX "Album_name_idx" ON "Album"("name");

-- CreateIndex
CREATE INDEX "Album_createdAt_idx" ON "Album"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Character_name_key" ON "Character"("name");

-- CreateIndex
CREATE INDEX "Character_name_idx" ON "Character"("name");

-- CreateIndex
CREATE INDEX "Character_createdAt_idx" ON "Character"("createdAt");

-- CreateIndex
CREATE INDEX "Character_class_idx" ON "Character"("class");

-- CreateIndex
CREATE INDEX "Character_race_idx" ON "Character"("race");

-- CreateIndex
CREATE UNIQUE INDEX "Place_name_key" ON "Place"("name");

-- CreateIndex
CREATE INDEX "Place_name_idx" ON "Place"("name");

-- CreateIndex
CREATE INDEX "Place_createdAt_idx" ON "Place"("createdAt");

-- CreateIndex
CREATE INDEX "Place_type_idx" ON "Place"("type");

-- CreateIndex
CREATE INDEX "Place_climate_idx" ON "Place"("climate");

-- CreateIndex
CREATE INDEX "Place_region_idx" ON "Place"("region");

-- CreateIndex
CREATE UNIQUE INDEX "Object_name_key" ON "Object"("name");

-- CreateIndex
CREATE INDEX "Object_name_idx" ON "Object"("name");

-- CreateIndex
CREATE INDEX "Object_createdAt_idx" ON "Object"("createdAt");

-- CreateIndex
CREATE INDEX "Object_type_idx" ON "Object"("type");

-- CreateIndex
CREATE INDEX "Object_rarity_idx" ON "Object"("rarity");

-- CreateIndex
CREATE INDEX "QueueJob_queue_status_idx" ON "QueueJob"("queue", "status");

-- CreateIndex
CREATE INDEX "QueueJob_status_createdAt_idx" ON "QueueJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "QueueJob_priority_status_createdAt_idx" ON "QueueJob"("priority", "status", "createdAt");

-- CreateIndex
CREATE INDEX "QueueJob_retryAt_idx" ON "QueueJob"("retryAt");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- CreateIndex
CREATE INDEX "Activity_imageId_idx" ON "Activity"("imageId");

-- CreateIndex
CREATE UNIQUE INDEX "Concept_name_key" ON "Concept"("name");

-- CreateIndex
CREATE INDEX "Concept_name_idx" ON "Concept"("name");

-- CreateIndex
CREATE INDEX "Concept_category_idx" ON "Concept"("category");

-- CreateIndex
CREATE INDEX "Concept_createdAt_idx" ON "Concept"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Prompt_name_key" ON "Prompt"("name");

-- CreateIndex
CREATE INDEX "Prompt_name_idx" ON "Prompt"("name");

-- CreateIndex
CREATE INDEX "Prompt_category_idx" ON "Prompt"("category");

-- CreateIndex
CREATE INDEX "Prompt_createdAt_idx" ON "Prompt"("createdAt");

-- CreateIndex
CREATE INDEX "Note_title_idx" ON "Note"("title");

-- CreateIndex
CREATE INDEX "Note_category_idx" ON "Note"("category");

-- CreateIndex
CREATE INDEX "Note_priority_idx" ON "Note"("priority");

-- CreateIndex
CREATE INDEX "Note_status_idx" ON "Note"("status");

-- CreateIndex
CREATE INDEX "Note_createdAt_idx" ON "Note"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Attribute_name_key" ON "Attribute"("name");

-- CreateIndex
CREATE INDEX "Attribute_name_idx" ON "Attribute"("name");

-- CreateIndex
CREATE INDEX "Attribute_type_idx" ON "Attribute"("type");

-- CreateIndex
CREATE INDEX "Attribute_category_idx" ON "Attribute"("category");

-- CreateIndex
CREATE INDEX "Attribute_createdAt_idx" ON "Attribute"("createdAt");

-- CreateIndex
CREATE INDEX "UniversalFavorite_entityType_idx" ON "UniversalFavorite"("entityType");

-- CreateIndex
CREATE INDEX "UniversalFavorite_createdAt_idx" ON "UniversalFavorite"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UniversalFavorite_entityId_entityType_key" ON "UniversalFavorite"("entityId", "entityType");

-- CreateIndex
CREATE UNIQUE INDEX "SystemImage_path_key" ON "SystemImage"("path");

-- CreateIndex
CREATE INDEX "SystemImage_type_idx" ON "SystemImage"("type");

-- CreateIndex
CREATE INDEX "SystemImage_category_idx" ON "SystemImage"("category");

-- CreateIndex
CREATE INDEX "SystemImage_createdAt_idx" ON "SystemImage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_ImageToTag_AB_unique" ON "_ImageToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_ImageToTag_B_index" ON "_ImageToTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ImageToPlace_AB_unique" ON "_ImageToPlace"("A", "B");

-- CreateIndex
CREATE INDEX "_ImageToPlace_B_index" ON "_ImageToPlace"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ImageToObject_AB_unique" ON "_ImageToObject"("A", "B");

-- CreateIndex
CREATE INDEX "_ImageToObject_B_index" ON "_ImageToObject"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ImageToCollection_AB_unique" ON "_ImageToCollection"("A", "B");

-- CreateIndex
CREATE INDEX "_ImageToCollection_B_index" ON "_ImageToCollection"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ImageToAlbum_AB_unique" ON "_ImageToAlbum"("A", "B");

-- CreateIndex
CREATE INDEX "_ImageToAlbum_B_index" ON "_ImageToAlbum"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ImageToCharacter_AB_unique" ON "_ImageToCharacter"("A", "B");

-- CreateIndex
CREATE INDEX "_ImageToCharacter_B_index" ON "_ImageToCharacter"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CharacterRelations_AB_unique" ON "_CharacterRelations"("A", "B");

-- CreateIndex
CREATE INDEX "_CharacterRelations_B_index" ON "_CharacterRelations"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CharacterToNote_AB_unique" ON "_CharacterToNote"("A", "B");

-- CreateIndex
CREATE INDEX "_CharacterToNote_B_index" ON "_CharacterToNote"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CharacterToConcept_AB_unique" ON "_CharacterToConcept"("A", "B");

-- CreateIndex
CREATE INDEX "_CharacterToConcept_B_index" ON "_CharacterToConcept"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CharacterToPrompt_AB_unique" ON "_CharacterToPrompt"("A", "B");

-- CreateIndex
CREATE INDEX "_CharacterToPrompt_B_index" ON "_CharacterToPrompt"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PlaceToPrompt_AB_unique" ON "_PlaceToPrompt"("A", "B");

-- CreateIndex
CREATE INDEX "_PlaceToPrompt_B_index" ON "_PlaceToPrompt"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ObjectToPrompt_AB_unique" ON "_ObjectToPrompt"("A", "B");

-- CreateIndex
CREATE INDEX "_ObjectToPrompt_B_index" ON "_ObjectToPrompt"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PlaceToConcept_AB_unique" ON "_PlaceToConcept"("A", "B");

-- CreateIndex
CREATE INDEX "_PlaceToConcept_B_index" ON "_PlaceToConcept"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ObjectToConcept_AB_unique" ON "_ObjectToConcept"("A", "B");

-- CreateIndex
CREATE INDEX "_ObjectToConcept_B_index" ON "_ObjectToConcept"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ConceptToNote_AB_unique" ON "_ConceptToNote"("A", "B");

-- CreateIndex
CREATE INDEX "_ConceptToNote_B_index" ON "_ConceptToNote"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ConceptToPrompt_AB_unique" ON "_ConceptToPrompt"("A", "B");

-- CreateIndex
CREATE INDEX "_ConceptToPrompt_B_index" ON "_ConceptToPrompt"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PlaceToNote_AB_unique" ON "_PlaceToNote"("A", "B");

-- CreateIndex
CREATE INDEX "_PlaceToNote_B_index" ON "_PlaceToNote"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ObjectToNote_AB_unique" ON "_ObjectToNote"("A", "B");

-- CreateIndex
CREATE INDEX "_ObjectToNote_B_index" ON "_ObjectToNote"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PromptToNote_AB_unique" ON "_PromptToNote"("A", "B");

-- CreateIndex
CREATE INDEX "_PromptToNote_B_index" ON "_PromptToNote"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CharacterToAttribute_AB_unique" ON "_CharacterToAttribute"("A", "B");

-- CreateIndex
CREATE INDEX "_CharacterToAttribute_B_index" ON "_CharacterToAttribute"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PlaceToAttribute_AB_unique" ON "_PlaceToAttribute"("A", "B");

-- CreateIndex
CREATE INDEX "_PlaceToAttribute_B_index" ON "_PlaceToAttribute"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ObjectToAttribute_AB_unique" ON "_ObjectToAttribute"("A", "B");

-- CreateIndex
CREATE INDEX "_ObjectToAttribute_B_index" ON "_ObjectToAttribute"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ConceptToAttribute_AB_unique" ON "_ConceptToAttribute"("A", "B");

-- CreateIndex
CREATE INDEX "_ConceptToAttribute_B_index" ON "_ConceptToAttribute"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PromptToAttribute_AB_unique" ON "_PromptToAttribute"("A", "B");

-- CreateIndex
CREATE INDEX "_PromptToAttribute_B_index" ON "_PromptToAttribute"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_NoteToAttribute_AB_unique" ON "_NoteToAttribute"("A", "B");

-- CreateIndex
CREATE INDEX "_NoteToAttribute_B_index" ON "_NoteToAttribute"("B");
