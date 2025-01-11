/*
  Warnings:

  - You are about to drop the column `isWatched` on the `Folder` table. All the data in the column will be lost.

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
    "level" INTEGER NOT NULL DEFAULT 1,
    "class" TEXT NOT NULL DEFAULT 'unknown',
    "race" TEXT NOT NULL DEFAULT 'unknown',
    "alignment" TEXT NOT NULL DEFAULT 'neutral',
    "backstory" TEXT NOT NULL DEFAULT '',
    "stats" TEXT NOT NULL DEFAULT '{}',
    "sortBy" TEXT NOT NULL DEFAULT 'name',
    "filters" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Character" ("color", "createdAt", "description", "emoji", "filters", "id", "name", "shortcut", "sortBy", "updatedAt") SELECT "color", "createdAt", "description", "emoji", "filters", "id", "name", "shortcut", "sortBy", "updatedAt" FROM "Character";
DROP TABLE "Character";
ALTER TABLE "new_Character" RENAME TO "Character";
CREATE UNIQUE INDEX "Character_name_key" ON "Character"("name");
CREATE INDEX "Character_name_idx" ON "Character"("name");
CREATE INDEX "Character_createdAt_idx" ON "Character"("createdAt");
CREATE INDEX "Character_class_idx" ON "Character"("class");
CREATE INDEX "Character_race_idx" ON "Character"("race");
CREATE TABLE "new_Folder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "totalFiles" INTEGER NOT NULL DEFAULT 0,
    "totalSize" INTEGER NOT NULL DEFAULT 0,
    "lastIndexed" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Folder" ("createdAt", "id", "lastIndexed", "name", "path", "totalFiles", "totalSize", "updatedAt") SELECT "createdAt", "id", "lastIndexed", "name", "path", "totalFiles", "totalSize", "updatedAt" FROM "Folder";
DROP TABLE "Folder";
ALTER TABLE "new_Folder" RENAME TO "Folder";
CREATE UNIQUE INDEX "Folder_path_key" ON "Folder"("path");
CREATE INDEX "Folder_path_idx" ON "Folder"("path");
CREATE INDEX "Folder_lastIndexed_idx" ON "Folder"("lastIndexed");
CREATE INDEX "Folder_createdAt_idx" ON "Folder"("createdAt");
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
    "sortBy" TEXT NOT NULL DEFAULT 'name',
    "filters" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Object" ("color", "createdAt", "description", "emoji", "filters", "id", "name", "shortcut", "sortBy", "updatedAt") SELECT "color", "createdAt", "description", "emoji", "filters", "id", "name", "shortcut", "sortBy", "updatedAt" FROM "Object";
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
    "climate" TEXT NOT NULL DEFAULT 'temperate',
    "population" INTEGER NOT NULL DEFAULT 0,
    "dangers" TEXT NOT NULL DEFAULT '[]',
    "resources" TEXT NOT NULL DEFAULT '[]',
    "lore" TEXT NOT NULL DEFAULT '',
    "sortBy" TEXT NOT NULL DEFAULT 'name',
    "filters" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Place" ("color", "createdAt", "description", "emoji", "filters", "id", "name", "shortcut", "sortBy", "updatedAt") SELECT "color", "createdAt", "description", "emoji", "filters", "id", "name", "shortcut", "sortBy", "updatedAt" FROM "Place";
DROP TABLE "Place";
ALTER TABLE "new_Place" RENAME TO "Place";
CREATE UNIQUE INDEX "Place_name_key" ON "Place"("name");
CREATE INDEX "Place_name_idx" ON "Place"("name");
CREATE INDEX "Place_createdAt_idx" ON "Place"("createdAt");
CREATE INDEX "Place_region_idx" ON "Place"("region");
CREATE INDEX "Place_climate_idx" ON "Place"("climate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
