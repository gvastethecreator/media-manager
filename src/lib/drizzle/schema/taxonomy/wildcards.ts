/**
 * =================================================================================
 * WILDCARDS ENTITY - DRIZZLE ORM
 * =================================================================================
 * Definición de la tabla wildcards para comodines de búsquedas
 * =================================================================================
 */

import { sql } from "drizzle-orm";
import { type AnySQLiteColumn, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// Modelo para los comodines
export const wildcards = sqliteTable(
	"Wildcard",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		description: text("description"),
		emoji: text("emoji").default("🎭"),
		color: text("color").default("#8b5cf6"),
		category: text("category"),
		children: text("children"),
		shortcut: text("shortcut"),
		featuredImage: text("featuredImage"),
		// @deprecated Usar tabla canónica `favorites`. ADR-0002 + batch bridge Favorite.
		isFavorite: integer("isFavorite", { mode: "boolean" }).notNull().default(false),
		parentId: text("parentId").references((): AnySQLiteColumn => wildcards.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		createdAt: integer("createdAt", { mode: "timestamp_ms" })
			.notNull()
			.default(
				sql`(CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER))`,
			),
		updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex("Wildcard_name_key").on(table.name),
		parentIdIdx: index("Wildcard_parentId_idx").on(table.parentId),
	}),
);
