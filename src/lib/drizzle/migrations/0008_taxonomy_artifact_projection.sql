CREATE TABLE `TaxonomyArtifact` (
	`entityType` text NOT NULL,
	`entityId` text NOT NULL,
	`rootId` text NOT NULL,
	`relativePath` text NOT NULL,
	`contentHash` text NOT NULL,
	`byteSize` integer NOT NULL,
	`syncStatus` text DEFAULT 'synced' NOT NULL,
	`indexedTitle` text NOT NULL,
	`indexedSummary` text,
	`indexedBody` text NOT NULL,
	`lastSyncedAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	PRIMARY KEY(`entityType`, `entityId`),
	FOREIGN KEY (`rootId`) REFERENCES `MediaRoot`(`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "TaxonomyArtifact_entity_type_check" CHECK(entityType IN ('prompt', 'note', 'wildcard')),
	CONSTRAINT "TaxonomyArtifact_sync_status_check" CHECK(syncStatus IN ('synced', 'external_change', 'missing', 'conflict', 'error')),
	CONSTRAINT "TaxonomyArtifact_content_hash_check" CHECK(length(contentHash) = 64 AND contentHash = lower(contentHash)
				AND contentHash NOT GLOB '*[^0-9a-f]*'),
	CONSTRAINT "TaxonomyArtifact_byte_size_check" CHECK(byteSize BETWEEN 0 AND 2097152),
	CONSTRAINT "TaxonomyArtifact_relative_path_check" CHECK(length(relativePath) BETWEEN 1 AND 2048
				AND substr(relativePath, 1, 1) <> '/'
				AND instr(relativePath, '\') = 0
				AND instr(relativePath, char(0)) = 0
				AND instr('/' || relativePath || '/', '/../') = 0
				AND instr('/' || relativePath || '/', '/./') = 0),
	CONSTRAINT "TaxonomyArtifact_storage_types_check" CHECK(typeof(entityType) = 'text' AND typeof(entityId) = 'text' AND typeof(rootId) = 'text'
				AND typeof(relativePath) = 'text' AND typeof(contentHash) = 'text' AND typeof(byteSize) = 'integer'
				AND typeof(syncStatus) = 'text' AND typeof(indexedTitle) = 'text'
				AND typeof(indexedSummary) IN ('null', 'text') AND typeof(indexedBody) = 'text'
				AND typeof(lastSyncedAt) = 'integer' AND typeof(createdAt) = 'integer'
				AND typeof(updatedAt) = 'integer'),
	CONSTRAINT "TaxonomyArtifact_timestamps_check" CHECK(lastSyncedAt >= 0 AND createdAt >= 0 AND updatedAt >= createdAt)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `TaxonomyArtifact_rootId_relativePath_key` ON `TaxonomyArtifact` (`rootId`,"relativePath" COLLATE NOCASE);--> statement-breakpoint
CREATE INDEX `TaxonomyArtifact_rootId_idx` ON `TaxonomyArtifact` (`rootId`);--> statement-breakpoint
CREATE INDEX `TaxonomyArtifact_syncStatus_idx` ON `TaxonomyArtifact` (`syncStatus`);--> statement-breakpoint
CREATE INDEX `TaxonomyArtifact_entityType_title_idx` ON `TaxonomyArtifact` (`entityType`,`indexedTitle`);