/*
  Warnings:

  - You are about to drop the `_CharacterToObject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CharacterToPlace` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ImageToConcept` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ImageToNote` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ImageToPrompt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `abilities` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `featuredImageId` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `inventory` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `personalNotes` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `socialConnections` on the `Character` table. All the data in the column will be lost.
  - You are about to drop the column `details` on the `Concept` table. All the data in the column will be lost.
  - You are about to drop the column `featuredImageId` on the `Concept` table. All the data in the column will be lost.
  - You are about to drop the column `filters` on the `Concept` table. All the data in the column will be lost.
  - You are about to drop the column `references` on the `Concept` table. All the data in the column will be lost.
  - You are about to drop the column `shortcut` on the `Concept` table. All the data in the column will be lost.
  - You are about to drop the column `sortBy` on the `Concept` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Concept` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `emoji` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `featuredImageId` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `filters` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `shortcut` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `sortBy` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `featuredImageId` on the `Object` table. All the data in the column will be lost.
  - You are about to drop the column `featuredImageId` on the `Place` table. All the data in the column will be lost.
  - You are about to drop the column `featuredImageId` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the column `filters` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the column `negativePrompt` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the column `prompt` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the column `shortcut` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the column `sortBy` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Prompt` table. All the data in the column will be lost.
  - Added the required column `title` to the `Note` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "_CharacterToObject_B_index";

-- DropIndex
DROP INDEX "_CharacterToObject_AB_unique";

-- DropIndex
DROP INDEX "_CharacterToPlace_B_index";

-- DropIndex
DROP INDEX "_CharacterToPlace_AB_unique";

-- DropIndex
DROP INDEX "_ImageToConcept_B_index";

-- DropIndex
DROP INDEX "_ImageToConcept_AB_unique";

-- DropIndex
DROP INDEX "_ImageToNote_B_index";

-- DropIndex
DROP INDEX "_ImageToNote_AB_unique";

-- DropIndex
DROP INDEX "_ImageToPrompt_B_index";

-- DropIndex
DROP INDEX "_ImageToPrompt_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_CharacterToObject";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_CharacterToPlace";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_ImageToConcept";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_ImageToNote";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_ImageToPrompt";
PRAGMA foreign_keys=on;

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
CREATE TABLE "_CharacterRelations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CharacterRelations_A_fkey" FOREIGN KEY ("A") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CharacterRelations_B_fkey" FOREIGN KEY ("B") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
INSERT INTO "new_Character" ("alignment", "backstory", "beliefs", "class", "color", "createdAt", "description", "emoji", "fears", "filters", "goals", "id", "level", "name", "personality", "race", "relationships", "shortcut", "sortBy", "stats", "updatedAt") SELECT "alignment", "backstory", "beliefs", "class", "color", "createdAt", "description", "emoji", "fears", "filters", "goals", "id", "level", "name", "personality", "race", "relationships", "shortcut", "sortBy", "stats", "updatedAt" FROM "Character";
DROP TABLE "Character";
ALTER TABLE "new_Character" RENAME TO "Character";
CREATE UNIQUE INDEX "Character_name_key" ON "Character"("name");
CREATE INDEX "Character_name_idx" ON "Character"("name");
CREATE INDEX "Character_createdAt_idx" ON "Character"("createdAt");
CREATE INDEX "Character_class_idx" ON "Character"("class");
CREATE INDEX "Character_race_idx" ON "Character"("race");
CREATE TABLE "new_Collection" (
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
INSERT INTO "new_Collection" ("color", "createdAt", "description", "emoji", "filters", "id", "name", "shortcut", "sortBy", "updatedAt") SELECT "color", "createdAt", "description", "emoji", "filters", "id", "name", "shortcut", "sortBy", "updatedAt" FROM "Collection";
DROP TABLE "Collection";
ALTER TABLE "new_Collection" RENAME TO "Collection";
CREATE UNIQUE INDEX "Collection_name_key" ON "Collection"("name");
CREATE INDEX "Collection_name_idx" ON "Collection"("name");
CREATE INDEX "Collection_createdAt_idx" ON "Collection"("createdAt");
CREATE TABLE "new_Concept" (
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
INSERT INTO "new_Concept" ("category", "color", "createdAt", "description", "emoji", "id", "name", "tags", "updatedAt") SELECT "category", "color", "createdAt", "description", "emoji", "id", "name", "tags", "updatedAt" FROM "Concept";
DROP TABLE "Concept";
ALTER TABLE "new_Concept" RENAME TO "Concept";
CREATE UNIQUE INDEX "Concept_name_key" ON "Concept"("name");
CREATE INDEX "Concept_name_idx" ON "Concept"("name");
CREATE INDEX "Concept_category_idx" ON "Concept"("category");
CREATE INDEX "Concept_createdAt_idx" ON "Concept"("createdAt");
CREATE TABLE "new_Folder" (
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
INSERT INTO "new_Folder" ("createdAt", "id", "lastIndexed", "name", "path", "totalFiles", "totalSize", "updatedAt") SELECT "createdAt", "id", "lastIndexed", "name", "path", "totalFiles", "totalSize", "updatedAt" FROM "Folder";
DROP TABLE "Folder";
ALTER TABLE "new_Folder" RENAME TO "Folder";
CREATE UNIQUE INDEX "Folder_path_key" ON "Folder"("path");
CREATE INDEX "Folder_path_idx" ON "Folder"("path");
CREATE INDEX "Folder_lastIndexed_idx" ON "Folder"("lastIndexed");
CREATE INDEX "Folder_createdAt_idx" ON "Folder"("createdAt");
CREATE TABLE "new_Note" (
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
INSERT INTO "new_Note" ("category", "content", "createdAt", "id", "tags", "updatedAt") SELECT "category", "content", "createdAt", "id", "tags", "updatedAt" FROM "Note";
DROP TABLE "Note";
ALTER TABLE "new_Note" RENAME TO "Note";
CREATE INDEX "Note_title_idx" ON "Note"("title");
CREATE INDEX "Note_category_idx" ON "Note"("category");
CREATE INDEX "Note_priority_idx" ON "Note"("priority");
CREATE INDEX "Note_status_idx" ON "Note"("status");
CREATE INDEX "Note_createdAt_idx" ON "Note"("createdAt");
CREATE TABLE "new_Object" (
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
INSERT INTO "new_Object" ("color", "createdAt", "description", "emoji", "filters", "id", "name", "origin", "properties", "rarity", "requirements", "shortcut", "sortBy", "stats", "type", "updatedAt") SELECT "color", "createdAt", "description", "emoji", "filters", "id", "name", "origin", "properties", "rarity", "requirements", "shortcut", "sortBy", "stats", "type", "updatedAt" FROM "Object";
DROP TABLE "Object";
ALTER TABLE "new_Object" RENAME TO "Object";
CREATE UNIQUE INDEX "Object_name_key" ON "Object"("name");
CREATE INDEX "Object_name_idx" ON "Object"("name");
CREATE INDEX "Object_createdAt_idx" ON "Object"("createdAt");
CREATE INDEX "Object_type_idx" ON "Object"("type");
CREATE INDEX "Object_rarity_idx" ON "Object"("rarity");
CREATE TABLE "new_Place" (
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
INSERT INTO "new_Place" ("climate", "color", "createdAt", "dangers", "description", "emoji", "filters", "government", "history", "id", "lore", "name", "population", "region", "resources", "shortcut", "sortBy", "stats", "type", "updatedAt") SELECT "climate", "color", "createdAt", "dangers", "description", "emoji", "filters", "government", "history", "id", "lore", "name", "population", "region", "resources", "shortcut", "sortBy", "stats", "type", "updatedAt" FROM "Place";
DROP TABLE "Place";
ALTER TABLE "new_Place" RENAME TO "Place";
CREATE UNIQUE INDEX "Place_name_key" ON "Place"("name");
CREATE INDEX "Place_name_idx" ON "Place"("name");
CREATE INDEX "Place_createdAt_idx" ON "Place"("createdAt");
CREATE INDEX "Place_type_idx" ON "Place"("type");
CREATE INDEX "Place_climate_idx" ON "Place"("climate");
CREATE INDEX "Place_region_idx" ON "Place"("region");
CREATE TABLE "new_Prompt" (
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
INSERT INTO "new_Prompt" ("category", "color", "createdAt", "description", "emoji", "id", "name", "parameters", "tags", "updatedAt") SELECT "category", "color", "createdAt", "description", "emoji", "id", "name", "parameters", "tags", "updatedAt" FROM "Prompt";
DROP TABLE "Prompt";
ALTER TABLE "new_Prompt" RENAME TO "Prompt";
CREATE UNIQUE INDEX "Prompt_name_key" ON "Prompt"("name");
CREATE INDEX "Prompt_name_idx" ON "Prompt"("name");
CREATE INDEX "Prompt_category_idx" ON "Prompt"("category");
CREATE INDEX "Prompt_createdAt_idx" ON "Prompt"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

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
CREATE UNIQUE INDEX "_CharacterRelations_AB_unique" ON "_CharacterRelations"("A", "B");

-- CreateIndex
CREATE INDEX "_CharacterRelations_B_index" ON "_CharacterRelations"("B");

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
