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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Place" ("climate", "color", "createdAt", "description", "emoji", "filters", "government", "history", "id", "name", "population", "shortcut", "sortBy", "stats", "type", "updatedAt") SELECT "climate", "color", "createdAt", "description", "emoji", "filters", "government", "history", "id", "name", "population", "shortcut", "sortBy", "stats", "type", "updatedAt" FROM "Place";
DROP TABLE "Place";
ALTER TABLE "new_Place" RENAME TO "Place";
CREATE UNIQUE INDEX "Place_name_key" ON "Place"("name");
CREATE INDEX "Place_name_idx" ON "Place"("name");
CREATE INDEX "Place_createdAt_idx" ON "Place"("createdAt");
CREATE INDEX "Place_type_idx" ON "Place"("type");
CREATE INDEX "Place_climate_idx" ON "Place"("climate");
CREATE INDEX "Place_region_idx" ON "Place"("region");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
