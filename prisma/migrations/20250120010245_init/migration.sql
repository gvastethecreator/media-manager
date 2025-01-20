-- CreateTable
CREATE TABLE "Concept" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '💡',
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "description" TEXT,
    "shortcut" TEXT,
    "type" TEXT NOT NULL DEFAULT 'general',
    "category" TEXT NOT NULL DEFAULT 'misc',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "details" TEXT NOT NULL DEFAULT '',
    "references" TEXT NOT NULL DEFAULT '[]',
    "featuredImageId" TEXT,
    "sortBy" TEXT NOT NULL DEFAULT 'name',
    "filters" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Concept_featuredImageId_fkey" FOREIGN KEY ("featuredImageId") REFERENCES "Image" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Prompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🤖',
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "description" TEXT,
    "shortcut" TEXT,
    "type" TEXT NOT NULL DEFAULT 'text',
    "category" TEXT NOT NULL DEFAULT 'misc',
    "prompt" TEXT NOT NULL DEFAULT '',
    "negativePrompt" TEXT,
    "parameters" TEXT NOT NULL DEFAULT '{}',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "featuredImageId" TEXT,
    "sortBy" TEXT NOT NULL DEFAULT 'name',
    "filters" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Prompt_featuredImageId_fkey" FOREIGN KEY ("featuredImageId") REFERENCES "Image" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '📝',
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "description" TEXT,
    "shortcut" TEXT,
    "type" TEXT NOT NULL DEFAULT 'text',
    "category" TEXT NOT NULL DEFAULT 'misc',
    "content" TEXT NOT NULL DEFAULT '',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "featuredImageId" TEXT,
    "sortBy" TEXT NOT NULL DEFAULT 'name',
    "filters" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Note_featuredImageId_fkey" FOREIGN KEY ("featuredImageId") REFERENCES "Image" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ImageToPrompt" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ImageToPrompt_A_fkey" FOREIGN KEY ("A") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ImageToPrompt_B_fkey" FOREIGN KEY ("B") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ImageToNote" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ImageToNote_A_fkey" FOREIGN KEY ("A") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ImageToNote_B_fkey" FOREIGN KEY ("B") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
CREATE TABLE "_CharacterToNote" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CharacterToNote_A_fkey" FOREIGN KEY ("A") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CharacterToNote_B_fkey" FOREIGN KEY ("B") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CharacterToPlace" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CharacterToPlace_A_fkey" FOREIGN KEY ("A") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CharacterToPlace_B_fkey" FOREIGN KEY ("B") REFERENCES "Place" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CharacterToObject" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CharacterToObject_A_fkey" FOREIGN KEY ("A") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CharacterToObject_B_fkey" FOREIGN KEY ("B") REFERENCES "Object" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
CREATE TABLE "_ImageToConcept" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ImageToConcept_A_fkey" FOREIGN KEY ("A") REFERENCES "Concept" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ImageToConcept_B_fkey" FOREIGN KEY ("B") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
CREATE TABLE "_ConceptToPrompt" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ConceptToPrompt_A_fkey" FOREIGN KEY ("A") REFERENCES "Concept" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ConceptToPrompt_B_fkey" FOREIGN KEY ("B") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ConceptToNote" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ConceptToNote_A_fkey" FOREIGN KEY ("A") REFERENCES "Concept" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ConceptToNote_B_fkey" FOREIGN KEY ("B") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "personality" TEXT NOT NULL DEFAULT '{}',
    "socialConnections" TEXT NOT NULL DEFAULT '[]',
    "goals" TEXT NOT NULL DEFAULT '[]',
    "fears" TEXT NOT NULL DEFAULT '[]',
    "beliefs" TEXT NOT NULL DEFAULT '[]',
    "relationships" TEXT NOT NULL DEFAULT '[]',
    "inventory" TEXT NOT NULL DEFAULT '[]',
    "abilities" TEXT NOT NULL DEFAULT '[]',
    "personalNotes" TEXT NOT NULL DEFAULT '',
    "featuredImageId" TEXT,
    "sortBy" TEXT NOT NULL DEFAULT 'name',
    "filters" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Character_featuredImageId_fkey" FOREIGN KEY ("featuredImageId") REFERENCES "Image" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Character" ("alignment", "backstory", "class", "color", "createdAt", "description", "emoji", "filters", "id", "level", "name", "race", "shortcut", "sortBy", "stats", "updatedAt") SELECT "alignment", "backstory", "class", "color", "createdAt", "description", "emoji", "filters", "id", "level", "name", "race", "shortcut", "sortBy", "stats", "updatedAt" FROM "Character";
DROP TABLE "Character";
ALTER TABLE "new_Character" RENAME TO "Character";
CREATE UNIQUE INDEX "Character_name_key" ON "Character"("name");
CREATE INDEX "Character_name_idx" ON "Character"("name");
CREATE INDEX "Character_createdAt_idx" ON "Character"("createdAt");
CREATE INDEX "Character_class_idx" ON "Character"("class");
CREATE INDEX "Character_race_idx" ON "Character"("race");
CREATE INDEX "Character_featuredImageId_idx" ON "Character"("featuredImageId");
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
    "featuredImageId" TEXT,
    "sortBy" TEXT NOT NULL DEFAULT 'name',
    "filters" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Object_featuredImageId_fkey" FOREIGN KEY ("featuredImageId") REFERENCES "Image" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Object" ("color", "createdAt", "description", "emoji", "filters", "id", "name", "origin", "properties", "rarity", "requirements", "shortcut", "sortBy", "stats", "type", "updatedAt") SELECT "color", "createdAt", "description", "emoji", "filters", "id", "name", "origin", "properties", "rarity", "requirements", "shortcut", "sortBy", "stats", "type", "updatedAt" FROM "Object";
DROP TABLE "Object";
ALTER TABLE "new_Object" RENAME TO "Object";
CREATE UNIQUE INDEX "Object_name_key" ON "Object"("name");
CREATE INDEX "Object_name_idx" ON "Object"("name");
CREATE INDEX "Object_createdAt_idx" ON "Object"("createdAt");
CREATE INDEX "Object_type_idx" ON "Object"("type");
CREATE INDEX "Object_rarity_idx" ON "Object"("rarity");
CREATE INDEX "Object_featuredImageId_idx" ON "Object"("featuredImageId");
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
    "featuredImageId" TEXT,
    "sortBy" TEXT NOT NULL DEFAULT 'name',
    "filters" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Place_featuredImageId_fkey" FOREIGN KEY ("featuredImageId") REFERENCES "Image" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
CREATE INDEX "Place_featuredImageId_idx" ON "Place"("featuredImageId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Concept_name_key" ON "Concept"("name");

-- CreateIndex
CREATE INDEX "Concept_name_idx" ON "Concept"("name");

-- CreateIndex
CREATE INDEX "Concept_createdAt_idx" ON "Concept"("createdAt");

-- CreateIndex
CREATE INDEX "Concept_type_idx" ON "Concept"("type");

-- CreateIndex
CREATE INDEX "Concept_category_idx" ON "Concept"("category");

-- CreateIndex
CREATE INDEX "Concept_featuredImageId_idx" ON "Concept"("featuredImageId");

-- CreateIndex
CREATE UNIQUE INDEX "Prompt_name_key" ON "Prompt"("name");

-- CreateIndex
CREATE INDEX "Prompt_name_idx" ON "Prompt"("name");

-- CreateIndex
CREATE INDEX "Prompt_createdAt_idx" ON "Prompt"("createdAt");

-- CreateIndex
CREATE INDEX "Prompt_type_idx" ON "Prompt"("type");

-- CreateIndex
CREATE INDEX "Prompt_category_idx" ON "Prompt"("category");

-- CreateIndex
CREATE INDEX "Prompt_featuredImageId_idx" ON "Prompt"("featuredImageId");

-- CreateIndex
CREATE UNIQUE INDEX "Note_name_key" ON "Note"("name");

-- CreateIndex
CREATE INDEX "Note_name_idx" ON "Note"("name");

-- CreateIndex
CREATE INDEX "Note_createdAt_idx" ON "Note"("createdAt");

-- CreateIndex
CREATE INDEX "Note_type_idx" ON "Note"("type");

-- CreateIndex
CREATE INDEX "Note_category_idx" ON "Note"("category");

-- CreateIndex
CREATE INDEX "Note_featuredImageId_idx" ON "Note"("featuredImageId");

-- CreateIndex
CREATE UNIQUE INDEX "_ImageToPrompt_AB_unique" ON "_ImageToPrompt"("A", "B");

-- CreateIndex
CREATE INDEX "_ImageToPrompt_B_index" ON "_ImageToPrompt"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ImageToNote_AB_unique" ON "_ImageToNote"("A", "B");

-- CreateIndex
CREATE INDEX "_ImageToNote_B_index" ON "_ImageToNote"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CharacterToConcept_AB_unique" ON "_CharacterToConcept"("A", "B");

-- CreateIndex
CREATE INDEX "_CharacterToConcept_B_index" ON "_CharacterToConcept"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CharacterToPrompt_AB_unique" ON "_CharacterToPrompt"("A", "B");

-- CreateIndex
CREATE INDEX "_CharacterToPrompt_B_index" ON "_CharacterToPrompt"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CharacterToNote_AB_unique" ON "_CharacterToNote"("A", "B");

-- CreateIndex
CREATE INDEX "_CharacterToNote_B_index" ON "_CharacterToNote"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CharacterToPlace_AB_unique" ON "_CharacterToPlace"("A", "B");

-- CreateIndex
CREATE INDEX "_CharacterToPlace_B_index" ON "_CharacterToPlace"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CharacterToObject_AB_unique" ON "_CharacterToObject"("A", "B");

-- CreateIndex
CREATE INDEX "_CharacterToObject_B_index" ON "_CharacterToObject"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PlaceToPrompt_AB_unique" ON "_PlaceToPrompt"("A", "B");

-- CreateIndex
CREATE INDEX "_PlaceToPrompt_B_index" ON "_PlaceToPrompt"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ObjectToPrompt_AB_unique" ON "_ObjectToPrompt"("A", "B");

-- CreateIndex
CREATE INDEX "_ObjectToPrompt_B_index" ON "_ObjectToPrompt"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ImageToConcept_AB_unique" ON "_ImageToConcept"("A", "B");

-- CreateIndex
CREATE INDEX "_ImageToConcept_B_index" ON "_ImageToConcept"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PlaceToConcept_AB_unique" ON "_PlaceToConcept"("A", "B");

-- CreateIndex
CREATE INDEX "_PlaceToConcept_B_index" ON "_PlaceToConcept"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ObjectToConcept_AB_unique" ON "_ObjectToConcept"("A", "B");

-- CreateIndex
CREATE INDEX "_ObjectToConcept_B_index" ON "_ObjectToConcept"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ConceptToPrompt_AB_unique" ON "_ConceptToPrompt"("A", "B");

-- CreateIndex
CREATE INDEX "_ConceptToPrompt_B_index" ON "_ConceptToPrompt"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ConceptToNote_AB_unique" ON "_ConceptToNote"("A", "B");

-- CreateIndex
CREATE INDEX "_ConceptToNote_B_index" ON "_ConceptToNote"("B");

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
