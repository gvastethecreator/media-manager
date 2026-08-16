CREATE TABLE `Asset` (
	`id` text PRIMARY KEY NOT NULL,
	`assetType` text NOT NULL,
	`title` text,
	`primarySourceFileId` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`statusBeforeDeletion` text,
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`archivedAt` integer,
	`deletedAt` integer,
	FOREIGN KEY (`id`,`primarySourceFileId`) REFERENCES `SourceFile`(`assetId`,`id`) ON UPDATE cascade ON DELETE restrict DEFERRABLE INITIALLY DEFERRED,
	CONSTRAINT "Asset_storage_types_check" CHECK(typeof(id) = 'text' AND typeof(assetType) = 'text' AND typeof(primarySourceFileId) = 'text'
				AND typeof(status) = 'text' AND typeof(title) IN ('null', 'text')
				AND typeof(statusBeforeDeletion) IN ('null', 'text')
				AND typeof(createdAt) = 'integer' AND typeof(updatedAt) = 'integer'
				AND typeof(archivedAt) IN ('null', 'integer') AND typeof(deletedAt) IN ('null', 'integer')),
	CONSTRAINT "Asset_timestamps_check" CHECK(createdAt >= 0 AND updatedAt >= createdAt
				AND (archivedAt IS NULL OR archivedAt >= createdAt)
				AND (deletedAt IS NULL OR deletedAt >= createdAt)),
	CONSTRAINT "Asset_type_check" CHECK(assetType IN ('image', 'video', 'audio', 'document', 'json', 'file3d')),
	CONSTRAINT "Asset_lifecycle_check" CHECK((
				status = 'active' AND archivedAt IS NULL AND deletedAt IS NULL AND statusBeforeDeletion IS NULL
			) OR (
				status = 'archived' AND archivedAt IS NOT NULL AND deletedAt IS NULL AND statusBeforeDeletion IS NULL
			) OR (
				status = 'deleted' AND deletedAt IS NOT NULL AND (
					(statusBeforeDeletion = 'active' AND archivedAt IS NULL) OR
					(statusBeforeDeletion = 'archived' AND archivedAt IS NOT NULL)
				)
			)),
	CONSTRAINT "Asset_title_check" CHECK(title IS NULL OR length(trim(title)) BETWEEN 1 AND 512)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Asset_primarySourceFileId_key` ON `Asset` (`primarySourceFileId`);--> statement-breakpoint
CREATE INDEX `Asset_status_idx` ON `Asset` (`status`);--> statement-breakpoint
CREATE INDEX `Asset_assetType_idx` ON `Asset` (`assetType`);--> statement-breakpoint
CREATE TABLE `MediaRoot` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`lastSeenAt` integer,
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	CONSTRAINT "MediaRoot_storage_types_check" CHECK(typeof(id) = 'text' AND typeof(label) = 'text' AND typeof(status) = 'text'
				AND typeof(createdAt) = 'integer' AND typeof(updatedAt) = 'integer'
				AND typeof(lastSeenAt) IN ('null', 'integer')),
	CONSTRAINT "MediaRoot_timestamps_check" CHECK(createdAt >= 0 AND updatedAt >= createdAt AND (lastSeenAt IS NULL OR lastSeenAt >= 0)),
	CONSTRAINT "MediaRoot_id_check" CHECK(length(id) BETWEEN 1 AND 64 AND substr(id, 1, 1) GLOB '[A-Za-z0-9]' AND id NOT GLOB '*[^A-Za-z0-9_-]*'),
	CONSTRAINT "MediaRoot_label_check" CHECK(length(trim(label)) BETWEEN 1 AND 255),
	CONSTRAINT "MediaRoot_status_check" CHECK(status IN ('active', 'retired'))
);
--> statement-breakpoint
CREATE INDEX `MediaRoot_status_idx` ON `MediaRoot` (`status`);--> statement-breakpoint
CREATE TABLE `SourceFile` (
	`id` text PRIMARY KEY NOT NULL,
	`assetId` text NOT NULL,
	`rootId` text NOT NULL,
	`relativePath` text NOT NULL,
	`folderId` text,
	`contentHash` text NOT NULL,
	`byteSize` integer NOT NULL,
	`availability` text NOT NULL,
	`fileIdentity` text,
	`mimeType` text,
	`extension` text,
	`fileCreatedAt` integer,
	`fileModifiedAt` integer,
	`observedAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	FOREIGN KEY (`assetId`) REFERENCES `Asset`(`id`) ON UPDATE cascade ON DELETE cascade DEFERRABLE INITIALLY DEFERRED,
	FOREIGN KEY (`rootId`) REFERENCES `MediaRoot`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`folderId`) REFERENCES `Folder`(`id`) ON UPDATE cascade ON DELETE set null,
	CONSTRAINT "SourceFile_storage_types_check" CHECK(typeof(id) = 'text' AND typeof(assetId) = 'text' AND typeof(rootId) = 'text'
				AND typeof(relativePath) = 'text' AND typeof(contentHash) = 'text'
				AND typeof(byteSize) = 'integer' AND typeof(availability) = 'text'
				AND typeof(folderId) IN ('null', 'text') AND typeof(fileIdentity) IN ('null', 'text')
				AND typeof(mimeType) IN ('null', 'text') AND typeof(extension) IN ('null', 'text')
				AND typeof(fileCreatedAt) IN ('null', 'integer') AND typeof(fileModifiedAt) IN ('null', 'integer')
				AND typeof(observedAt) = 'integer' AND typeof(createdAt) = 'integer'
				AND typeof(updatedAt) = 'integer'),
	CONSTRAINT "SourceFile_timestamps_check" CHECK(observedAt >= 0 AND createdAt >= 0 AND updatedAt >= createdAt
				AND (fileCreatedAt IS NULL OR fileCreatedAt >= 0)
				AND (fileModifiedAt IS NULL OR fileModifiedAt >= 0)),
	CONSTRAINT "SourceFile_availability_check" CHECK(availability IN ('available', 'missing', 'root_offline', 'inaccessible')),
	CONSTRAINT "SourceFile_byte_size_check" CHECK(byteSize BETWEEN 0 AND 107374182400),
	CONSTRAINT "SourceFile_content_hash_check" CHECK(length(contentHash) = 64 AND contentHash = lower(contentHash)
				AND contentHash NOT GLOB '*[^0-9a-f]*'),
	CONSTRAINT "SourceFile_extension_check" CHECK(extension IS NULL OR (
				length(extension) BETWEEN 1 AND 32 AND extension = lower(extension) AND extension NOT LIKE '.%'
			)),
	CONSTRAINT "SourceFile_file_identity_check" CHECK(fileIdentity IS NULL OR length(fileIdentity) BETWEEN 1 AND 512),
	CONSTRAINT "SourceFile_mime_type_check" CHECK(mimeType IS NULL OR length(mimeType) BETWEEN 3 AND 255),
	CONSTRAINT "SourceFile_relative_path_check" CHECK(length(relativePath) BETWEEN 1 AND 2048
				AND relativePath = trim(relativePath)
				AND relativePath NOT LIKE '/%'
				AND relativePath NOT LIKE '%\%'
				AND relativePath NOT LIKE '%:%'
				AND instr(relativePath, char(0)) = 0
				AND relativePath NOT LIKE '%//%'
				AND relativePath NOT IN ('.', '..')
				AND relativePath NOT LIKE './%'
				AND relativePath NOT LIKE '../%'
				AND relativePath NOT LIKE '%/./%'
				AND relativePath NOT LIKE '%/../%'
				AND relativePath NOT LIKE '%/.'
				AND relativePath NOT LIKE '%/..')
);
--> statement-breakpoint
CREATE INDEX `SourceFile_assetId_idx` ON `SourceFile` (`assetId`);--> statement-breakpoint
CREATE UNIQUE INDEX `SourceFile_assetId_id_key` ON `SourceFile` (`assetId`,`id`);--> statement-breakpoint
CREATE INDEX `SourceFile_availability_idx` ON `SourceFile` (`availability`);--> statement-breakpoint
CREATE INDEX `SourceFile_contentHash_idx` ON `SourceFile` (`contentHash`);--> statement-breakpoint
CREATE INDEX `SourceFile_rootId_fileIdentity_idx` ON `SourceFile` (`rootId`,`fileIdentity`);--> statement-breakpoint
CREATE INDEX `SourceFile_folderId_idx` ON `SourceFile` (`folderId`);--> statement-breakpoint
CREATE UNIQUE INDEX `SourceFile_rootId_relativePath_key` ON `SourceFile` (`rootId`,"relativePath" COLLATE NOCASE);--> statement-breakpoint
CREATE INDEX `SourceFile_rootId_idx` ON `SourceFile` (`rootId`);
