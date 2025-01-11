/*
  Warnings:

  - You are about to drop the column `dangers` on the `Place` table. All the data in the column will be lost.
  - You are about to drop the column `lore` on the `Place` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `Place` table. All the data in the column will be lost.
  - You are about to drop the column `resources` on the `Place` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Place" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '📍',
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "description" TEXT,
    "shortcut" TEXT,
    "type" TEXT NOT NULL DEFAULT 'unknown',
    "climate" TEXT NOT NULL DEFAULT 'temperate',
    "population" INTEGER NOT NULL DEFAULT 0,
    "government" TEXT NOT NULL DEFAULT 'unknown',
    "history" TEXT NOT NULL DEFAULT '',
    "stats" TEXT NOT NULL DEFAULT '{}',
    "sortBy" TEXT NOT NULL DEFAULT 'name',
    "filters" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Place" ("climate", "color", "createdAt", "description", "emoji", "filters", "id", "name", "population", "shortcut", "sortBy", "updatedAt") SELECT "climate", "color", "createdAt", "description", "emoji", "filters", "id", "name", "population", "shortcut", "sortBy", "updatedAt" FROM "Place";
DROP TABLE "Place";
ALTER TABLE "new_Place" RENAME TO "Place";
CREATE UNIQUE INDEX "Place_name_key" ON "Place"("name");
CREATE INDEX "Place_name_idx" ON "Place"("name");
CREATE INDEX "Place_createdAt_idx" ON "Place"("createdAt");
CREATE INDEX "Place_type_idx" ON "Place"("type");
CREATE INDEX "Place_climate_idx" ON "Place"("climate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
