-- media-manager: foreign-keys-off
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_Image` (
	`id` text PRIMARY KEY NOT NULL,
	`assetId` text,
	`name` text NOT NULL,
	`description` text,
	`path` text NOT NULL,
	`hash` text NOT NULL,
	`size` integer NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`metadata` text,
	`thumbnail` text,
	`thumbnailSize` integer,
	`thumbnailWidth` integer,
	`thumbnailHeight` integer,
	`thumbnailMimeType` text,
	`thumbnailError` text,
	`thumbnailErrorAt` integer,
	`thumbnailOptimizedAt` integer,
	`aiEngine` text,
	`aiModel` text,
	`aiOriginDetected` integer DEFAULT false,
	`isFavorite` integer DEFAULT false NOT NULL,
	`folderId` text NOT NULL,
	`noteId` text,
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	`addedAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	FOREIGN KEY (`assetId`) REFERENCES `Asset`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`folderId`) REFERENCES `Folder`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`noteId`) REFERENCES `Note`(`id`) ON UPDATE cascade ON DELETE set null,
	CONSTRAINT "Image_size_check" CHECK(size >= 0 AND size <= 107374182400),
	CONSTRAINT "Image_dimensions_check" CHECK(width > 0 AND width <= 32768 AND height > 0 AND height <= 32768),
	CONSTRAINT "Image_hash_format_check" CHECK(length(hash) = 64),
	CONSTRAINT "Image_asset_identity_check" CHECK(assetId IS NULL OR (typeof(assetId) = 'text' AND assetId = id)),
	CONSTRAINT "Image_path_length_check" CHECK(length(path) BETWEEN 1 AND 1000)
);
--> statement-breakpoint
INSERT INTO `__new_Image`("id", "assetId", "name", "description", "path", "hash", "size", "width", "height", "metadata", "thumbnail", "thumbnailSize", "thumbnailWidth", "thumbnailHeight", "thumbnailMimeType", "thumbnailError", "thumbnailErrorAt", "thumbnailOptimizedAt", "aiEngine", "aiModel", "aiOriginDetected", "isFavorite", "folderId", "noteId", "createdAt", "updatedAt", "addedAt") SELECT "id", NULL, "name", "description", "path", "hash", "size", "width", "height", "metadata", "thumbnail", "thumbnailSize", "thumbnailWidth", "thumbnailHeight", "thumbnailMimeType", "thumbnailError", "thumbnailErrorAt", "thumbnailOptimizedAt", "aiEngine", "aiModel", "aiOriginDetected", "isFavorite", "folderId", "noteId", "createdAt", "updatedAt", "addedAt" FROM `Image`;--> statement-breakpoint
DROP TABLE `Image`;--> statement-breakpoint
ALTER TABLE `__new_Image` RENAME TO `Image`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `Image_assetId_key` ON `Image` (`assetId`);--> statement-breakpoint
CREATE UNIQUE INDEX `Image_path_folderId_key` ON `Image` (`path`,`folderId`);--> statement-breakpoint
CREATE INDEX `Image_folderId_idx` ON `Image` (`folderId`);--> statement-breakpoint
CREATE INDEX `Image_hash_idx` ON `Image` (`hash`);--> statement-breakpoint
CREATE INDEX `Image_folderId_hash_idx` ON `Image` (`folderId`,`hash`);--> statement-breakpoint
CREATE INDEX `Image_createdAt_idx` ON `Image` (`createdAt`);--> statement-breakpoint
CREATE INDEX `Image_updatedAt_idx` ON `Image` (`updatedAt`);--> statement-breakpoint
CREATE INDEX `Image_isFavorite_idx` ON `Image` (`isFavorite`);--> statement-breakpoint
CREATE INDEX `Image_aiEngine_idx` ON `Image` (`aiEngine`);--> statement-breakpoint
CREATE INDEX `Image_aiOriginDetected_idx` ON `Image` (`aiOriginDetected`);
