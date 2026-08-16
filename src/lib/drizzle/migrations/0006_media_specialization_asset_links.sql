-- media-manager: foreign-keys-off
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_Audio` (
	`id` text PRIMARY KEY NOT NULL,
	`assetId` text,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`size` integer NOT NULL,
	`hash` text NOT NULL,
	`mimeType` text NOT NULL,
	`extension` text NOT NULL,
	`folderId` text NOT NULL,
	`isFavorite` integer DEFAULT false NOT NULL,
	`isArchived` integer DEFAULT false NOT NULL,
	`duration` integer,
	`bitrate` integer,
	`sampleRate` integer,
	`channels` integer,
	`format` text,
	`codec` text,
	`title` text,
	`artist` text,
	`album` text,
	`year` integer,
	`genre` text,
	`track` integer,
	`disc` integer,
	`albumArtist` text,
	`composer` text,
	`comment` text,
	`lyrics` text,
	`bpm` integer,
	`key` text,
	`mood` text,
	`metadata` text,
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`assetId`) REFERENCES `Asset`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`folderId`) REFERENCES `Folder`(`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "Audio_size_check" CHECK(size >= 0 AND size <= 107374182400),
	CONSTRAINT "Audio_duration_check" CHECK(duration IS NULL OR duration >= 0),
	CONSTRAINT "Audio_hash_format_check" CHECK(length(hash) = 64),
	CONSTRAINT "Audio_asset_identity_check" CHECK(assetId IS NULL OR (typeof(assetId) = 'text' AND assetId = id)),
	CONSTRAINT "Audio_path_length_check" CHECK(length(path) BETWEEN 1 AND 1000),
	CONSTRAINT "Audio_numeric_metadata_check" CHECK((bitrate IS NULL OR bitrate >= 0) AND (sampleRate IS NULL OR sampleRate >= 0) AND (channels IS NULL OR channels >= 0) AND (track IS NULL OR track >= 0) AND (disc IS NULL OR disc >= 0) AND (bpm IS NULL OR bpm >= 0))
);
--> statement-breakpoint
INSERT INTO `__new_Audio`("id", "assetId", "name", "path", "size", "hash", "mimeType", "extension", "folderId", "isFavorite", "isArchived", "duration", "bitrate", "sampleRate", "channels", "format", "codec", "title", "artist", "album", "year", "genre", "track", "disc", "albumArtist", "composer", "comment", "lyrics", "bpm", "key", "mood", "metadata", "createdAt", "updatedAt") SELECT "id", NULL, "name", "path", "size", "hash", "mimeType", "extension", "folderId", "isFavorite", "isArchived", "duration", "bitrate", "sampleRate", "channels", "format", "codec", "title", "artist", "album", "year", "genre", "track", "disc", "albumArtist", "composer", "comment", "lyrics", "bpm", "key", "mood", "metadata", "createdAt", "updatedAt" FROM `Audio`;--> statement-breakpoint
DROP TABLE `Audio`;--> statement-breakpoint
ALTER TABLE `__new_Audio` RENAME TO `Audio`;--> statement-breakpoint
CREATE UNIQUE INDEX `Audio_assetId_key` ON `Audio` (`assetId`);--> statement-breakpoint
CREATE UNIQUE INDEX `Audio_path_key` ON `Audio` (`path`);--> statement-breakpoint
CREATE INDEX `Audio_folderId_idx` ON `Audio` (`folderId`);--> statement-breakpoint
CREATE INDEX `Audio_hash_idx` ON `Audio` (`hash`);--> statement-breakpoint
CREATE INDEX `Audio_folderId_hash_idx` ON `Audio` (`folderId`,`hash`);--> statement-breakpoint
CREATE INDEX `Audio_createdAt_idx` ON `Audio` (`createdAt`);--> statement-breakpoint
CREATE INDEX `Audio_updatedAt_idx` ON `Audio` (`updatedAt`);--> statement-breakpoint
CREATE TABLE `__new_Document` (
	`id` text PRIMARY KEY NOT NULL,
	`assetId` text,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`size` integer NOT NULL,
	`hash` text NOT NULL,
	`mimeType` text NOT NULL,
	`extension` text NOT NULL,
	`thumbnail` text,
	`thumbnailSize` integer,
	`thumbnailWidth` integer,
	`thumbnailHeight` integer,
	`thumbnailMimeType` text,
	`thumbnailError` text,
	`thumbnailErrorAt` integer,
	`folderId` text NOT NULL,
	`isFavorite` integer DEFAULT false NOT NULL,
	`isArchived` integer DEFAULT false NOT NULL,
	`pageCount` integer,
	`wordCount` integer,
	`language` text,
	`title` text,
	`author` text,
	`subject` text,
	`keywords` text,
	`creator` text,
	`producer` text,
	`creationDate` integer,
	`modificationDate` integer,
	`encrypted` integer DEFAULT false,
	`version` text,
	`content` text,
	`summary` text,
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`assetId`) REFERENCES `Asset`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`folderId`) REFERENCES `Folder`(`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "Document_size_check" CHECK(size >= 0 AND size <= 107374182400),
	CONSTRAINT "Document_hash_format_check" CHECK(length(hash) = 64),
	CONSTRAINT "Document_asset_identity_check" CHECK(assetId IS NULL OR (typeof(assetId) = 'text' AND assetId = id)),
	CONSTRAINT "Document_path_length_check" CHECK(length(path) BETWEEN 1 AND 1000),
	CONSTRAINT "Document_page_count_check" CHECK(pageCount IS NULL OR pageCount >= 0),
	CONSTRAINT "Document_word_count_check" CHECK(wordCount IS NULL OR wordCount >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_Document`("id", "assetId", "name", "path", "size", "hash", "mimeType", "extension", "thumbnail", "thumbnailSize", "thumbnailWidth", "thumbnailHeight", "thumbnailMimeType", "thumbnailError", "thumbnailErrorAt", "folderId", "isFavorite", "isArchived", "pageCount", "wordCount", "language", "title", "author", "subject", "keywords", "creator", "producer", "creationDate", "modificationDate", "encrypted", "version", "content", "summary", "createdAt", "updatedAt") SELECT "id", NULL, "name", "path", "size", "hash", "mimeType", "extension", "thumbnail", "thumbnailSize", "thumbnailWidth", "thumbnailHeight", "thumbnailMimeType", "thumbnailError", "thumbnailErrorAt", "folderId", "isFavorite", "isArchived", "pageCount", "wordCount", "language", "title", "author", "subject", "keywords", "creator", "producer", "creationDate", "modificationDate", "encrypted", "version", "content", "summary", "createdAt", "updatedAt" FROM `Document`;--> statement-breakpoint
DROP TABLE `Document`;--> statement-breakpoint
ALTER TABLE `__new_Document` RENAME TO `Document`;--> statement-breakpoint
CREATE UNIQUE INDEX `Document_assetId_key` ON `Document` (`assetId`);--> statement-breakpoint
CREATE UNIQUE INDEX `Document_path_key` ON `Document` (`path`);--> statement-breakpoint
CREATE INDEX `Document_folderId_idx` ON `Document` (`folderId`);--> statement-breakpoint
CREATE INDEX `Document_hash_idx` ON `Document` (`hash`);--> statement-breakpoint
CREATE INDEX `Document_folderId_hash_idx` ON `Document` (`folderId`,`hash`);--> statement-breakpoint
CREATE INDEX `Document_createdAt_idx` ON `Document` (`createdAt`);--> statement-breakpoint
CREATE INDEX `Document_updatedAt_idx` ON `Document` (`updatedAt`);--> statement-breakpoint
CREATE TABLE `__new_File3D` (
	`id` text PRIMARY KEY NOT NULL,
	`assetId` text,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`size` integer NOT NULL,
	`hash` text NOT NULL,
	`mimeType` text NOT NULL,
	`extension` text NOT NULL,
	`folderId` text NOT NULL,
	`isFavorite` integer DEFAULT false NOT NULL,
	`isArchived` integer DEFAULT false NOT NULL,
	`format` text,
	`version` text,
	`vertices` integer,
	`faces` integer,
	`triangles` integer,
	`materials` integer,
	`textures` integer,
	`animations` integer,
	`bones` integer,
	`scenes` integer,
	`cameras` integer,
	`lights` integer,
	`hasUV` integer DEFAULT false,
	`hasNormals` integer DEFAULT false,
	`hasColors` integer DEFAULT false,
	`boundingBox` text,
	`metadata` text,
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`assetId`) REFERENCES `Asset`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`folderId`) REFERENCES `Folder`(`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "File3D_size_check" CHECK(size >= 0 AND size <= 107374182400),
	CONSTRAINT "File3D_hash_format_check" CHECK(length(hash) = 64),
	CONSTRAINT "File3D_asset_identity_check" CHECK(assetId IS NULL OR (typeof(assetId) = 'text' AND assetId = id)),
	CONSTRAINT "File3D_path_length_check" CHECK(length(path) BETWEEN 1 AND 1000),
	CONSTRAINT "File3D_geometry_counts_check" CHECK((vertices IS NULL OR vertices >= 0) AND (faces IS NULL OR faces >= 0) AND (triangles IS NULL OR triangles >= 0) AND (materials IS NULL OR materials >= 0) AND (textures IS NULL OR textures >= 0) AND (animations IS NULL OR animations >= 0) AND (bones IS NULL OR bones >= 0) AND (scenes IS NULL OR scenes >= 0) AND (cameras IS NULL OR cameras >= 0) AND (lights IS NULL OR lights >= 0))
);
--> statement-breakpoint
INSERT INTO `__new_File3D`("id", "assetId", "name", "path", "size", "hash", "mimeType", "extension", "folderId", "isFavorite", "isArchived", "format", "version", "vertices", "faces", "triangles", "materials", "textures", "animations", "bones", "scenes", "cameras", "lights", "hasUV", "hasNormals", "hasColors", "boundingBox", "metadata", "createdAt", "updatedAt") SELECT "id", NULL, "name", "path", "size", "hash", "mimeType", "extension", "folderId", "isFavorite", "isArchived", "format", "version", "vertices", "faces", "triangles", "materials", "textures", "animations", "bones", "scenes", "cameras", "lights", "hasUV", "hasNormals", "hasColors", "boundingBox", "metadata", "createdAt", "updatedAt" FROM `File3D`;--> statement-breakpoint
DROP TABLE `File3D`;--> statement-breakpoint
ALTER TABLE `__new_File3D` RENAME TO `File3D`;--> statement-breakpoint
CREATE UNIQUE INDEX `File3D_assetId_key` ON `File3D` (`assetId`);--> statement-breakpoint
CREATE UNIQUE INDEX `File3D_path_key` ON `File3D` (`path`);--> statement-breakpoint
CREATE INDEX `File3D_folderId_idx` ON `File3D` (`folderId`);--> statement-breakpoint
CREATE INDEX `File3D_hash_idx` ON `File3D` (`hash`);--> statement-breakpoint
CREATE INDEX `File3D_folderId_hash_idx` ON `File3D` (`folderId`,`hash`);--> statement-breakpoint
CREATE INDEX `File3D_createdAt_idx` ON `File3D` (`createdAt`);--> statement-breakpoint
CREATE INDEX `File3D_updatedAt_idx` ON `File3D` (`updatedAt`);--> statement-breakpoint
CREATE TABLE `__new_JsonFile` (
	`id` text PRIMARY KEY NOT NULL,
	`assetId` text,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`size` integer NOT NULL,
	`hash` text NOT NULL,
	`mimeType` text NOT NULL,
	`extension` text NOT NULL,
	`folderId` text NOT NULL,
	`isFavorite` integer DEFAULT false NOT NULL,
	`isArchived` integer DEFAULT false NOT NULL,
	`content` text,
	`schema` text,
	`isValid` integer DEFAULT true,
	`validationErrors` text,
	`keyCount` integer,
	`depth` integer,
	`description` text,
	`emoji` text,
	`color` text,
	`shortcut` text,
	`category` text,
	`filePath` text,
	`fileName` text,
	`fileSize` integer,
	`tags` text,
	`metadata` text,
	`sortBy` text,
	`filters` text,
	`featuredImage` text,
	`validJson` integer DEFAULT false,
	`schemaVersion` text,
	`keys` text,
	`values` text,
	`hasArrays` integer DEFAULT false,
	`hasObjects` integer DEFAULT false,
	`encoding` text,
	`compressed` integer DEFAULT false,
	`minified` integer DEFAULT false,
	`prettyPrinted` integer DEFAULT false,
	`parsedContent` text,
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`assetId`) REFERENCES `Asset`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`folderId`) REFERENCES `Folder`(`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "JsonFile_size_check" CHECK(size >= 0 AND size <= 107374182400),
	CONSTRAINT "JsonFile_hash_format_check" CHECK(length(hash) = 64),
	CONSTRAINT "JsonFile_asset_identity_check" CHECK(assetId IS NULL OR (typeof(assetId) = 'text' AND assetId = id)),
	CONSTRAINT "JsonFile_path_length_check" CHECK(length(path) BETWEEN 1 AND 1000),
	CONSTRAINT "JsonFile_shape_check" CHECK((fileSize IS NULL OR fileSize >= 0) AND (keyCount IS NULL OR keyCount >= 0) AND (depth IS NULL OR depth >= 0))
);
--> statement-breakpoint
INSERT INTO `__new_JsonFile`("id", "assetId", "name", "path", "size", "hash", "mimeType", "extension", "folderId", "isFavorite", "isArchived", "content", "schema", "isValid", "validationErrors", "keyCount", "depth", "description", "emoji", "color", "shortcut", "category", "filePath", "fileName", "fileSize", "tags", "metadata", "sortBy", "filters", "featuredImage", "validJson", "schemaVersion", "keys", "values", "hasArrays", "hasObjects", "encoding", "compressed", "minified", "prettyPrinted", "parsedContent", "createdAt", "updatedAt") SELECT "id", NULL, "name", "path", "size", "hash", "mimeType", "extension", "folderId", "isFavorite", "isArchived", "content", "schema", "isValid", "validationErrors", "keyCount", "depth", "description", "emoji", "color", "shortcut", "category", "filePath", "fileName", "fileSize", "tags", "metadata", "sortBy", "filters", "featuredImage", "validJson", "schemaVersion", "keys", "values", "hasArrays", "hasObjects", "encoding", "compressed", "minified", "prettyPrinted", "parsedContent", "createdAt", "updatedAt" FROM `JsonFile`;--> statement-breakpoint
DROP TABLE `JsonFile`;--> statement-breakpoint
ALTER TABLE `__new_JsonFile` RENAME TO `JsonFile`;--> statement-breakpoint
CREATE UNIQUE INDEX `JsonFile_assetId_key` ON `JsonFile` (`assetId`);--> statement-breakpoint
CREATE UNIQUE INDEX `JsonFile_path_key` ON `JsonFile` (`path`);--> statement-breakpoint
CREATE INDEX `JsonFile_folderId_idx` ON `JsonFile` (`folderId`);--> statement-breakpoint
CREATE INDEX `JsonFile_hash_idx` ON `JsonFile` (`hash`);--> statement-breakpoint
CREATE INDEX `JsonFile_folderId_hash_idx` ON `JsonFile` (`folderId`,`hash`);--> statement-breakpoint
CREATE INDEX `JsonFile_createdAt_idx` ON `JsonFile` (`createdAt`);--> statement-breakpoint
CREATE INDEX `JsonFile_updatedAt_idx` ON `JsonFile` (`updatedAt`);--> statement-breakpoint
CREATE TABLE `__new_Video` (
	`id` text PRIMARY KEY NOT NULL,
	`assetId` text,
	`name` text NOT NULL,
	`description` text,
	`path` text NOT NULL,
	`hash` text NOT NULL,
	`size` integer NOT NULL,
	`duration` integer NOT NULL,
	`width` integer,
	`height` integer,
	`metadata` text,
	`thumbnail` text,
	`thumbnailSize` integer,
	`thumbnailWidth` integer,
	`thumbnailHeight` integer,
	`isFavorite` integer DEFAULT false NOT NULL,
	`isHidden` integer DEFAULT false NOT NULL,
	`folderId` text NOT NULL,
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`assetId`) REFERENCES `Asset`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`folderId`) REFERENCES `Folder`(`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "Video_size_check" CHECK(size >= 0 AND size <= 107374182400),
	CONSTRAINT "Video_duration_check" CHECK(duration >= 0 AND duration <= 86400),
	CONSTRAINT "Video_hash_format_check" CHECK(length(hash) = 64),
	CONSTRAINT "Video_asset_identity_check" CHECK(assetId IS NULL OR (typeof(assetId) = 'text' AND assetId = id)),
	CONSTRAINT "Video_path_length_check" CHECK(length(path) BETWEEN 1 AND 1000)
);
--> statement-breakpoint
INSERT INTO `__new_Video`("id", "assetId", "name", "description", "path", "hash", "size", "duration", "width", "height", "metadata", "thumbnail", "thumbnailSize", "thumbnailWidth", "thumbnailHeight", "isFavorite", "isHidden", "folderId", "createdAt", "updatedAt") SELECT "id", NULL, "name", "description", "path", "hash", "size", "duration", "width", "height", "metadata", "thumbnail", "thumbnailSize", "thumbnailWidth", "thumbnailHeight", "isFavorite", "isHidden", "folderId", "createdAt", "updatedAt" FROM `Video`;--> statement-breakpoint
DROP TABLE `Video`;--> statement-breakpoint
ALTER TABLE `__new_Video` RENAME TO `Video`;--> statement-breakpoint
CREATE UNIQUE INDEX `Video_assetId_key` ON `Video` (`assetId`);--> statement-breakpoint
CREATE UNIQUE INDEX `Video_path_key` ON `Video` (`path`);--> statement-breakpoint
CREATE INDEX `Video_folderId_idx` ON `Video` (`folderId`);--> statement-breakpoint
CREATE INDEX `Video_hash_idx` ON `Video` (`hash`);--> statement-breakpoint
CREATE INDEX `Video_folderId_hash_idx` ON `Video` (`folderId`,`hash`);--> statement-breakpoint
CREATE INDEX `Video_createdAt_idx` ON `Video` (`createdAt`);--> statement-breakpoint
CREATE INDEX `Video_updatedAt_idx` ON `Video` (`updatedAt`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
