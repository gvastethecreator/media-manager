import { sql } from "drizzle-orm";
import { check, index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { mediaRoots } from "../media-core/assets";

const epochMilliseconds = sql`(CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER))`;

/** Operational projection for file-backed Prompt, Note and Wildcard content. */
export const taxonomyArtifacts = sqliteTable(
	"TaxonomyArtifact",
	{
		entityType: text("entityType").notNull(),
		entityId: text("entityId").notNull(),
		rootId: text("rootId")
			.notNull()
			.references(() => mediaRoots.id, { onDelete: "restrict", onUpdate: "cascade" }),
		relativePath: text("relativePath").notNull(),
		contentHash: text("contentHash").notNull(),
		byteSize: integer("byteSize").notNull(),
		syncStatus: text("syncStatus").notNull().default("synced"),
		indexedTitle: text("indexedTitle").notNull(),
		indexedSummary: text("indexedSummary"),
		indexedBody: text("indexedBody").notNull(),
		lastSyncedAt: integer("lastSyncedAt", { mode: "timestamp_ms" }).notNull().default(epochMilliseconds),
		createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().default(epochMilliseconds),
		updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
			.notNull()
			.default(epochMilliseconds)
			.$onUpdate(() => new Date()),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.entityType, table.entityId], name: "TaxonomyArtifact_pk" }),
		locationKey: uniqueIndex("TaxonomyArtifact_rootId_relativePath_key").on(
			table.rootId,
			sql`${table.relativePath} COLLATE NOCASE`,
		),
		rootIdIdx: index("TaxonomyArtifact_rootId_idx").on(table.rootId),
		statusIdx: index("TaxonomyArtifact_syncStatus_idx").on(table.syncStatus),
		typeTitleIdx: index("TaxonomyArtifact_entityType_title_idx").on(table.entityType, table.indexedTitle),
		entityTypeCheck: check("TaxonomyArtifact_entity_type_check", sql`entityType IN ('prompt', 'note', 'wildcard')`),
		syncStatusCheck: check(
			"TaxonomyArtifact_sync_status_check",
			sql`syncStatus IN ('synced', 'external_change', 'missing', 'conflict', 'error')`,
		),
		contentHashCheck: check(
			"TaxonomyArtifact_content_hash_check",
			sql`length(contentHash) = 64 AND contentHash = lower(contentHash)
				AND contentHash NOT GLOB '*[^0-9a-f]*'`,
		),
		byteSizeCheck: check("TaxonomyArtifact_byte_size_check", sql`byteSize BETWEEN 0 AND 2097152`),
		relativePathCheck: check(
			"TaxonomyArtifact_relative_path_check",
			sql`length(relativePath) BETWEEN 1 AND 2048
				AND substr(relativePath, 1, 1) <> '/'
				AND instr(relativePath, '\\') = 0
				AND instr(relativePath, char(0)) = 0
				AND instr('/' || relativePath || '/', '/../') = 0
				AND instr('/' || relativePath || '/', '/./') = 0`,
		),
		storageTypesCheck: check(
			"TaxonomyArtifact_storage_types_check",
			sql`typeof(entityType) = 'text' AND typeof(entityId) = 'text' AND typeof(rootId) = 'text'
				AND typeof(relativePath) = 'text' AND typeof(contentHash) = 'text' AND typeof(byteSize) = 'integer'
				AND typeof(syncStatus) = 'text' AND typeof(indexedTitle) = 'text'
				AND typeof(indexedSummary) IN ('null', 'text') AND typeof(indexedBody) = 'text'
				AND typeof(lastSyncedAt) = 'integer' AND typeof(createdAt) = 'integer'
				AND typeof(updatedAt) = 'integer'`,
		),
		timestampsCheck: check(
			"TaxonomyArtifact_timestamps_check",
			sql`lastSyncedAt >= 0 AND createdAt >= 0 AND updatedAt >= createdAt`,
		),
	}),
);
