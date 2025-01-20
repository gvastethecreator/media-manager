-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Album" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '📸',
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "shortcut" TEXT,
    "sortBy" TEXT NOT NULL DEFAULT 'name',
    "filters" TEXT NOT NULL DEFAULT '[]',
    "featuredImage" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Album" ("color", "createdAt", "description", "emoji", "filters", "id", "name", "shortcut", "sortBy", "updatedAt") SELECT "color", "createdAt", "description", "emoji", "filters", "id", "name", "shortcut", "sortBy", "updatedAt" FROM "Album";
DROP TABLE "Album";
ALTER TABLE "new_Album" RENAME TO "Album";
CREATE UNIQUE INDEX "Album_name_key" ON "Album"("name");
CREATE INDEX "Album_name_idx" ON "Album"("name");
CREATE INDEX "Album_createdAt_idx" ON "Album"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
