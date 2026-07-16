import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { folders } from '../organization/folders';

const epochMilliseconds = sql`(CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER))`;

export const mediaRoots = sqliteTable(
	'MediaRoot',
	{
		id: text('id').primaryKey(),
		label: text('label').notNull(),
		status: text('status').notNull().default('active'),
		lastSeenAt: integer('lastSeenAt', { mode: 'timestamp_ms' }),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(epochMilliseconds),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(epochMilliseconds)
			.$onUpdate(() => new Date()),
	},
	(table) => ({
		statusIdx: index('MediaRoot_status_idx').on(table.status),
		storageTypesCheck: check(
			'MediaRoot_storage_types_check',
			sql`typeof(id) = 'text' AND typeof(label) = 'text' AND typeof(status) = 'text'
				AND typeof(createdAt) = 'integer' AND typeof(updatedAt) = 'integer'
				AND typeof(lastSeenAt) IN ('null', 'integer')`
		),
		timestampsCheck: check(
			'MediaRoot_timestamps_check',
			sql`createdAt >= 0 AND updatedAt >= createdAt AND (lastSeenAt IS NULL OR lastSeenAt >= 0)`
		),
		idCheck: check(
			'MediaRoot_id_check',
			sql`length(id) BETWEEN 1 AND 64 AND substr(id, 1, 1) GLOB '[A-Za-z0-9]' AND id NOT GLOB '*[^A-Za-z0-9_-]*'`
		),
		labelCheck: check('MediaRoot_label_check', sql`length(trim(label)) BETWEEN 1 AND 255`),
		statusCheck: check('MediaRoot_status_check', sql`status IN ('active', 'retired')`),
	})
);

export const assets = sqliteTable(
	'Asset',
	{
		id: text('id').primaryKey(),
		assetType: text('assetType').notNull(),
		title: text('title'),
		primarySourceFileId: text('primarySourceFileId').notNull(),
		status: text('status').notNull().default('active'),
		statusBeforeDeletion: text('statusBeforeDeletion'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(epochMilliseconds),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(epochMilliseconds)
			.$onUpdate(() => new Date()),
		archivedAt: integer('archivedAt', { mode: 'timestamp_ms' }),
		deletedAt: integer('deletedAt', { mode: 'timestamp_ms' }),
	},
	(table) => ({
		// Drizzle cannot represent SQLite DEFERRABLE FKs. Migration 0004 owns the two cyclic FKs;
		// the migration runner independently rejects a final schema that loses either deferred clause.
		primarySourceFileKey: uniqueIndex('Asset_primarySourceFileId_key').on(table.primarySourceFileId),
		statusIdx: index('Asset_status_idx').on(table.status),
		typeIdx: index('Asset_assetType_idx').on(table.assetType),
		storageTypesCheck: check(
			'Asset_storage_types_check',
			sql`typeof(id) = 'text' AND typeof(assetType) = 'text' AND typeof(primarySourceFileId) = 'text'
				AND typeof(status) = 'text' AND typeof(title) IN ('null', 'text')
				AND typeof(statusBeforeDeletion) IN ('null', 'text')
				AND typeof(createdAt) = 'integer' AND typeof(updatedAt) = 'integer'
				AND typeof(archivedAt) IN ('null', 'integer') AND typeof(deletedAt) IN ('null', 'integer')`
		),
		timestampsCheck: check(
			'Asset_timestamps_check',
			sql`createdAt >= 0 AND updatedAt >= createdAt
				AND (archivedAt IS NULL OR archivedAt >= createdAt)
				AND (deletedAt IS NULL OR deletedAt >= createdAt)`
		),
		assetTypeCheck: check(
			'Asset_type_check',
			sql`assetType IN ('image', 'video', 'audio', 'document', 'json', 'file3d')`
		),
		lifecycleCheck: check(
			'Asset_lifecycle_check',
			sql`(
				status = 'active' AND archivedAt IS NULL AND deletedAt IS NULL AND statusBeforeDeletion IS NULL
			) OR (
				status = 'archived' AND archivedAt IS NOT NULL AND deletedAt IS NULL AND statusBeforeDeletion IS NULL
			) OR (
				status = 'deleted' AND deletedAt IS NOT NULL AND (
					(statusBeforeDeletion = 'active' AND archivedAt IS NULL) OR
					(statusBeforeDeletion = 'archived' AND archivedAt IS NOT NULL)
				)
			)`
		),
		titleCheck: check('Asset_title_check', sql`title IS NULL OR length(trim(title)) BETWEEN 1 AND 512`),
	})
);

export const sourceFiles = sqliteTable(
	'SourceFile',
	{
		id: text('id').primaryKey(),
		// Migration 0004 adds the cyclic Asset FK as DEFERRABLE; see the schema invariant gate.
		assetId: text('assetId').notNull(),
		rootId: text('rootId')
			.notNull()
			.references(() => mediaRoots.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
		relativePath: text('relativePath').notNull(),
		folderId: text('folderId').references(() => folders.id, { onDelete: 'set null', onUpdate: 'cascade' }),
		contentHash: text('contentHash').notNull(),
		byteSize: integer('byteSize').notNull(),
		availability: text('availability').notNull(),
		fileIdentity: text('fileIdentity'),
		mimeType: text('mimeType'),
		extension: text('extension'),
		fileCreatedAt: integer('fileCreatedAt', { mode: 'timestamp_ms' }),
		fileModifiedAt: integer('fileModifiedAt', { mode: 'timestamp_ms' }),
		observedAt: integer('observedAt', { mode: 'timestamp_ms' }).notNull().default(epochMilliseconds),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(epochMilliseconds),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(epochMilliseconds)
			.$onUpdate(() => new Date()),
	},
	(table) => ({
		assetIdIdx: index('SourceFile_assetId_idx').on(table.assetId),
		assetSourceKey: uniqueIndex('SourceFile_assetId_id_key').on(table.assetId, table.id),
		availabilityIdx: index('SourceFile_availability_idx').on(table.availability),
		contentHashIdx: index('SourceFile_contentHash_idx').on(table.contentHash),
		fileIdentityIdx: index('SourceFile_rootId_fileIdentity_idx').on(table.rootId, table.fileIdentity),
		folderIdIdx: index('SourceFile_folderId_idx').on(table.folderId),
		locationKey: uniqueIndex('SourceFile_rootId_relativePath_key').on(
			table.rootId,
			sql`${table.relativePath} COLLATE NOCASE`
		),
		rootIdIdx: index('SourceFile_rootId_idx').on(table.rootId),
		storageTypesCheck: check(
			'SourceFile_storage_types_check',
			sql`typeof(id) = 'text' AND typeof(assetId) = 'text' AND typeof(rootId) = 'text'
				AND typeof(relativePath) = 'text' AND typeof(contentHash) = 'text'
				AND typeof(byteSize) = 'integer' AND typeof(availability) = 'text'
				AND typeof(folderId) IN ('null', 'text') AND typeof(fileIdentity) IN ('null', 'text')
				AND typeof(mimeType) IN ('null', 'text') AND typeof(extension) IN ('null', 'text')
				AND typeof(fileCreatedAt) IN ('null', 'integer') AND typeof(fileModifiedAt) IN ('null', 'integer')
				AND typeof(observedAt) = 'integer' AND typeof(createdAt) = 'integer'
				AND typeof(updatedAt) = 'integer'`
		),
		timestampsCheck: check(
			'SourceFile_timestamps_check',
			sql`observedAt >= 0 AND createdAt >= 0 AND updatedAt >= createdAt
				AND (fileCreatedAt IS NULL OR fileCreatedAt >= 0)
				AND (fileModifiedAt IS NULL OR fileModifiedAt >= 0)`
		),
		availabilityCheck: check(
			'SourceFile_availability_check',
			sql`availability IN ('available', 'missing', 'root_offline', 'inaccessible')`
		),
		byteSizeCheck: check('SourceFile_byte_size_check', sql`byteSize BETWEEN 0 AND 107374182400`),
		contentHashCheck: check(
			'SourceFile_content_hash_check',
			sql`length(contentHash) = 64 AND contentHash = lower(contentHash)
				AND contentHash NOT GLOB '*[^0-9a-f]*'`
		),
			extensionCheck: check(
			'SourceFile_extension_check',
			sql`extension IS NULL OR (
				length(extension) BETWEEN 1 AND 32 AND extension = lower(extension) AND extension NOT LIKE '.%'
			)`
		),
		fileIdentityCheck: check(
			'SourceFile_file_identity_check',
			sql`fileIdentity IS NULL OR length(fileIdentity) BETWEEN 1 AND 512`
		),
		mimeTypeCheck: check(
			'SourceFile_mime_type_check',
			sql`mimeType IS NULL OR length(mimeType) BETWEEN 3 AND 255`
		),
		relativePathCheck: check(
			'SourceFile_relative_path_check',
			sql`length(relativePath) BETWEEN 1 AND 2048
				AND relativePath = trim(relativePath)
				AND relativePath NOT LIKE '/%'
				AND relativePath NOT LIKE '%\\%'
				AND relativePath NOT LIKE '%:%'
				AND instr(relativePath, char(0)) = 0
				AND relativePath NOT LIKE '%//%'
				AND relativePath NOT IN ('.', '..')
				AND relativePath NOT LIKE './%'
				AND relativePath NOT LIKE '../%'
				AND relativePath NOT LIKE '%/./%'
				AND relativePath NOT LIKE '%/../%'
				AND relativePath NOT LIKE '%/.'
				AND relativePath NOT LIKE '%/..'`
		),
	})
);
