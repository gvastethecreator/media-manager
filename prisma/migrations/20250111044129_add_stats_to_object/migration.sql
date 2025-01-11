-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Object" ("color", "createdAt", "description", "emoji", "filters", "id", "name", "origin", "properties", "rarity", "requirements", "shortcut", "sortBy", "type", "updatedAt") SELECT "color", "createdAt", "description", "emoji", "filters", "id", "name", "origin", "properties", "rarity", "requirements", "shortcut", "sortBy", "type", "updatedAt" FROM "Object";
DROP TABLE "Object";
ALTER TABLE "new_Object" RENAME TO "Object";
CREATE UNIQUE INDEX "Object_name_key" ON "Object"("name");
CREATE INDEX "Object_name_idx" ON "Object"("name");
CREATE INDEX "Object_createdAt_idx" ON "Object"("createdAt");
CREATE INDEX "Object_type_idx" ON "Object"("type");
CREATE INDEX "Object_rarity_idx" ON "Object"("rarity");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
