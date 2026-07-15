-- Media Manager representative schema (DDL only; no row data or source path).
-- Objects with explicit SQL: 218.

CREATE TABLE `Activity` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`entityType` text NOT NULL,
	`entityId` text NOT NULL,
	`userId` text,
	`action` text NOT NULL,
	`description` text,
	`metadata` text,
	`ipAddress` text,
	`userAgent` text,
	`sessionId` text,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);

CREATE TABLE `Album` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`emoji` text DEFAULT '📔',
	`color` text DEFAULT '#f59e0b',
	`featuredImage` text,
	`isFavorite` integer DEFAULT false NOT NULL,
	`filters` text,
	`category` text,
	`metadata` text,
	`lastImageAddedAt` integer,
	`lastVideoAddedAt` integer,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer
);

CREATE TABLE `Audio` (
	`id` text PRIMARY KEY NOT NULL,
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
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer
);

CREATE TABLE `Character` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`emoji` text DEFAULT '👤',
	`color` text DEFAULT '#ec4899',
	`category` text,
	`filters` text,
	`isFavorite` integer DEFAULT false NOT NULL,
	`metadata` text,
	`age` text,
	`gender` text,
	`species` text,
	`occupation` text,
	`personality` text,
	`background` text,
	`relationships` text,
	`skills` text,
	`equipment` text,
	`notes` text,
	`featuredImage` text,
	`parentId` text,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer
);

CREATE TABLE `Collection` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`emoji` text DEFAULT '📚',
	`color` text DEFAULT '#3b82f6',
	`featuredImage` text,
	`isFavorite` integer DEFAULT false NOT NULL,
	`lastImageAddedAt` integer,
	`lastVideoAddedAt` integer,
	`parentId` text,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer
);

CREATE TABLE `Concept` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`emoji` text DEFAULT '💡',
	`color` text DEFAULT '#f59e0b',
	`category` text,
	`filters` text,
	`isFavorite` integer DEFAULT false NOT NULL,
	`metadata` text,
	`type` text,
	`complexity` text,
	`applications` text,
	`examples` text,
	`relatedConcepts` text,
	`notes` text,
	`featuredImage` text,
	`parentId` text,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer
);

CREATE TABLE `Document` (
	`id` text PRIMARY KEY NOT NULL,
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
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer
);

CREATE TABLE `EntityAggregates` (
	`entityType` text NOT NULL,
	`entityId` text NOT NULL,
	`totalImages` integer DEFAULT 0 NOT NULL,
	`totalVideos` integer DEFAULT 0 NOT NULL,
	`totalAudio` integer DEFAULT 0 NOT NULL,
	`totalDocuments` integer DEFAULT 0 NOT NULL,
	`totalJsonFiles` integer DEFAULT 0 NOT NULL,
	`totalFile3D` integer DEFAULT 0 NOT NULL,
	`totalFiles` integer DEFAULT 0 NOT NULL,
	`totalSize` integer DEFAULT 0 NOT NULL,
	`lastIndexed` integer DEFAULT (CURRENT_TIMESTAMP),
	`updatedAt` integer,
	PRIMARY KEY(`entityType`, `entityId`)
);

CREATE TABLE `Favorite` (
	`id` text PRIMARY KEY NOT NULL,
	`entityType` text NOT NULL,
	`entityId` text NOT NULL,
	`addedAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
, "profileId" text);

CREATE TABLE `File` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`size` integer NOT NULL,
	`hash` text NOT NULL,
	`mimeType` text NOT NULL,
	`extension` text NOT NULL,
	`fileType` text NOT NULL,
	`folderId` text NOT NULL,
	`isFavorite` integer DEFAULT false NOT NULL,
	`isArchived` integer DEFAULT false NOT NULL,
	`description` text,
	`tags` text,
	`metadata` text,
	`lastAccessed` integer,
	`accessCount` integer DEFAULT 0,
	`isProcessed` integer DEFAULT false,
	`processingError` text,
	`processingStatus` text DEFAULT 'pending',
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer
);

CREATE TABLE `File3D` (
	`id` text PRIMARY KEY NOT NULL,
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
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer
);

CREATE TABLE `FileStats` (
	`id` text PRIMARY KEY NOT NULL,
	`fileId` text NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`rating` integer DEFAULT 0,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer
);

CREATE TABLE `Folder` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`path` text NOT NULL,
	`emoji` text DEFAULT '📁',
	`color` text DEFAULT '#3b82f6',
	`featuredImage` text,
	`isFavorite` integer DEFAULT false NOT NULL,
	`totalImages` integer DEFAULT 0 NOT NULL,
	`totalVideos` integer DEFAULT 0 NOT NULL,
	`totalFiles` integer DEFAULT 0 NOT NULL,
	`totalSize` integer DEFAULT 0 NOT NULL,
	`lastIndexed` integer DEFAULT (CURRENT_TIMESTAMP),
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer,
	`parentId` text,
	`presetId` text,
	CONSTRAINT "Folder_path_length_check" CHECK(length(path) BETWEEN 1 AND 1000),
	CONSTRAINT "Folder_name_length_check" CHECK(length(name) BETWEEN 1 AND 255),
	CONSTRAINT "Folder_color_format_check" CHECK(color IS NULL OR (color LIKE '#%' AND length(color) = 7)),
	CONSTRAINT "Folder_total_files_check" CHECK(totalFiles >= 0),
	CONSTRAINT "Folder_total_size_check" CHECK(totalSize >= 0)
);

CREATE TABLE `Group` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer
);

CREATE TABLE `Image` (
	`id` text PRIMARY KEY NOT NULL,
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
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer,
	`addedAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	CONSTRAINT "Image_size_check" CHECK(size >= 0 AND size <= 107374182400),
	CONSTRAINT "Image_dimensions_check" CHECK(width > 0 AND width <= 32768 AND height > 0 AND height <= 32768),
	CONSTRAINT "Image_hash_format_check" CHECK(length(hash) = 64),
	CONSTRAINT "Image_path_length_check" CHECK(length(path) BETWEEN 1 AND 1000)
);

CREATE TABLE `JsonFile` (
	`id` text PRIMARY KEY NOT NULL,
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
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer
);

CREATE TABLE `Metadata` (
	`id` text PRIMARY KEY NOT NULL,
	`entityType` text NOT NULL,
	`entityId` text NOT NULL,
	`key` text NOT NULL,
	`value` text,
	`type` text DEFAULT 'string',
	`category` text,
	`description` text,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer
);

CREATE TABLE `Note` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`category` text DEFAULT 'general' NOT NULL,
	`featuredImage` text,
	`isFavorite` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer
);

CREATE TABLE `Place` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`emoji` text DEFAULT '📍',
	`color` text DEFAULT '#14b8a6',
	`category` text,
	`filters` text,
	`isFavorite` integer DEFAULT false NOT NULL,
	`metadata` text,
	`type` text,
	`location` text,
	`climate` text,
	`population` text,
	`government` text,
	`economy` text,
	`culture` text,
	`history` text,
	`geography` text,
	`landmarks` text,
	`dangers` text,
	`resources` text,
	`notes` text,
	`featuredImage` text,
	`parentId` text,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer
);

CREATE TABLE `Profile` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`emoji` text DEFAULT '👤' NOT NULL,
	`color` text DEFAULT '#3b82f6' NOT NULL,
	`description` text,
	`isActive` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer,
	`settingsId` text,
	`imageId` text
);

CREATE TABLE `Prompt` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`content` text,
	`emoji` text DEFAULT '🔮',
	`color` text DEFAULT '#8b5cf6',
	`category` text,
	`filters` text,
	`isFavorite` integer DEFAULT false NOT NULL,
	`metadata` text,
	`type` text,
	`notes` text,
	`featuredImage` text,
	`parentId` text,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer
);

CREATE TABLE `Property` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`emoji` text DEFAULT '🔍',
	`color` text DEFAULT '#f97316',
	`category` text,
	`featuredImage` text,
	`isFavorite` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer
);

CREATE TABLE `QueueJob` (
	`id` text PRIMARY KEY NOT NULL,
	`queue` text NOT NULL,
	`data` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`maxAttempts` integer DEFAULT 3 NOT NULL,
	`error` text,
	`progress` integer DEFAULT 0 NOT NULL,
	`startedAt` integer,
	`finishedAt` integer,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer,
	`priority` integer DEFAULT 0 NOT NULL,
	`metadata` text,
	`retryAt` integer
);

CREATE TABLE `Settings` (
	`id` text PRIMARY KEY NOT NULL,
	`theme` text DEFAULT 'system' NOT NULL,
	`language` text DEFAULT 'es' NOT NULL,
	`data` text NOT NULL,
	`profileId` text NOT NULL
);

CREATE TABLE `Tag` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`emoji` text DEFAULT '🏷️',
	`color` text DEFAULT '#22c55e',
	`category` text,
	`featuredImage` text,
	`isFavorite` integer DEFAULT false NOT NULL,
	`parentId` text,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer
);

CREATE TABLE `Task` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`emoji` text DEFAULT '📋',
	`color` text DEFAULT '#6366f1',
	`category` text,
	`tags` text,
	`dueDate` integer,
	`completedAt` integer,
	`estimatedHours` real,
	`actualHours` real,
	`progress` integer DEFAULT 0 NOT NULL,
	`assignedTo` text,
	`parentTaskId` text,
	`projectId` text,
	`notes` text,
	`featuredImage` text,
	`isFavorite` integer DEFAULT false NOT NULL,
	`isArchived` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer
);

CREATE TABLE `Thumbnail` (
	`id` text PRIMARY KEY NOT NULL,
	`entityType` text NOT NULL,
	`entityId` text NOT NULL,
	`size` text NOT NULL,
	`path` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`format` text NOT NULL,
	`quality` integer DEFAULT 80,
	`fileSize` integer NOT NULL,
	`isGenerated` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer
);

CREATE TABLE `UploadedImage` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`size` integer NOT NULL,
	`hash` text NOT NULL,
	`metadata` text,
	`imageId` text NOT NULL,
	`type` text DEFAULT 'thumbnail' NOT NULL,
	`category` text DEFAULT 'user' NOT NULL,
	`width` integer,
	`height` integer,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer
);

CREATE TABLE `Video` (
	`id` text PRIMARY KEY NOT NULL,
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
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer,
	CONSTRAINT "Video_size_check" CHECK(size >= 0 AND size <= 107374182400),
	CONSTRAINT "Video_duration_check" CHECK(duration >= 0 AND duration <= 86400),
	CONSTRAINT "Video_hash_format_check" CHECK(length(hash) = 64),
	CONSTRAINT "Video_path_length_check" CHECK(length(path) BETWEEN 1 AND 1000)
);

CREATE TABLE `Wildcard` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`emoji` text DEFAULT '🎭',
	`color` text DEFAULT '#8b5cf6',
	`category` text,
	`children` text,
	`featuredImage` text,
	`isFavorite` integer DEFAULT false NOT NULL,
	`parentId` text,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer
);

CREATE TABLE `WorldItem` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`emoji` text DEFAULT '🎯',
	`color` text DEFAULT '#a855f7',
	`category` text,
	`subtype` text,
	`isFavorite` integer DEFAULT false NOT NULL,
	`isArchived` integer DEFAULT false NOT NULL,
	`type` text,
	`rarity` text,
	`value` text,
	`weight` text,
	`size` text,
	`material` text,
	`materials` text,
	`crafting` text,
	`requirements` text,
	`effects` text,
	`origin` text,
	`properties` text,
	`uses` text,
	`history` text,
	`notes` text,
	`lore` text,
	`sortBy` text,
	`filters` text,
	`featuredImage` text,
	`parentId` text,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer
);

CREATE TABLE `_AlbumToTask` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_CharacterToTask` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_GroupToAlbum` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_GroupToImage` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_GroupToTag` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_GroupToVideo` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_ImageToAlbum` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_ImageToCharacter` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_ImageToCollection` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_ImageToConcept` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_ImageToNote` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_ImageToPlace` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_ImageToPrompt` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_ImageToProperty` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_ImageToTag` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_ImageToTask` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_ImageToWildcard` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_ImageToWorldItem` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_VideoToAlbum` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_VideoToCharacter` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_VideoToCollection` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_VideoToConcept` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_VideoToNote` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_VideoToPlace` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_VideoToPrompt` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_VideoToProperty` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_VideoToTag` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_VideoToTask` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_VideoToWildcard` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `_VideoToWorldItem` (
	`A` text NOT NULL,
	`B` text NOT NULL
);

CREATE TABLE `dev_features` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

CREATE VIRTUAL TABLE media_fts USING fts5(
  name,
  content,
  entity_type,
  entity_id,
  tokenize = 'unicode61 remove_diacritics 2'
);

CREATE TABLE 'media_fts_config'(k PRIMARY KEY, v) WITHOUT ROWID;

CREATE TABLE 'media_fts_content'(id INTEGER PRIMARY KEY, c0, c1, c2, c3);

CREATE TABLE 'media_fts_data'(id INTEGER PRIMARY KEY, block BLOB);

CREATE TABLE 'media_fts_docsize'(id INTEGER PRIMARY KEY, sz BLOB);

CREATE TABLE 'media_fts_idx'(segid, term, pgno, PRIMARY KEY(segid, term)) WITHOUT ROWID;

CREATE TABLE `server_alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`level` text DEFAULT 'info' NOT NULL,
	`service` text,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`details` text,
	`resolved` integer DEFAULT false NOT NULL,
	`resolved_at` integer,
	`created_at` integer NOT NULL
);

CREATE INDEX `Activity_action_idx` ON `Activity` (`action`);

CREATE INDEX `Activity_createdAt_idx` ON `Activity` (`createdAt`);

CREATE INDEX `Activity_entityId_idx` ON `Activity` (`entityId`);

CREATE INDEX `Activity_entityType_idx` ON `Activity` (`entityType`);

CREATE INDEX `Activity_type_idx` ON `Activity` (`type`);

CREATE INDEX `Activity_userId_idx` ON `Activity` (`userId`);

CREATE UNIQUE INDEX `Album_name_key` ON `Album` (`name`);

CREATE INDEX `Audio_createdAt_idx` ON `Audio` (`createdAt`);

CREATE INDEX `Audio_folderId_idx` ON `Audio` (`folderId`);

CREATE INDEX `Audio_hash_idx` ON `Audio` (`hash`);

CREATE UNIQUE INDEX `Audio_path_key` ON `Audio` (`path`);

CREATE INDEX `Audio_updatedAt_idx` ON `Audio` (`updatedAt`);

CREATE UNIQUE INDEX `Character_name_key` ON `Character` (`name`);

CREATE UNIQUE INDEX `Collection_name_key` ON `Collection` (`name`);

CREATE UNIQUE INDEX `Concept_name_key` ON `Concept` (`name`);

CREATE INDEX `Document_createdAt_idx` ON `Document` (`createdAt`);

CREATE INDEX `Document_folderId_idx` ON `Document` (`folderId`);

CREATE INDEX `Document_hash_idx` ON `Document` (`hash`);

CREATE UNIQUE INDEX `Document_path_key` ON `Document` (`path`);

CREATE INDEX `Document_updatedAt_idx` ON `Document` (`updatedAt`);

CREATE INDEX `EntityAggregates_lastIndexed_idx` ON `EntityAggregates` (`lastIndexed`);

CREATE INDEX `Favorite_addedAt_idx` ON `Favorite` (`addedAt`);

CREATE INDEX `Favorite_entityType_idx` ON `Favorite` (`entityType`);

CREATE INDEX "Favorite_profileId_addedAt_idx" ON "Favorite" ("profileId", "addedAt");

CREATE UNIQUE INDEX "Favorite_profileId_entityType_entityId_key" ON "Favorite" ("profileId", "entityType", "entityId");

CREATE INDEX "Favorite_profileId_idx" ON "Favorite" ("profileId");

CREATE INDEX `File3D_createdAt_idx` ON `File3D` (`createdAt`);

CREATE INDEX `File3D_folderId_idx` ON `File3D` (`folderId`);

CREATE INDEX `File3D_hash_idx` ON `File3D` (`hash`);

CREATE UNIQUE INDEX `File3D_path_key` ON `File3D` (`path`);

CREATE INDEX `File3D_updatedAt_idx` ON `File3D` (`updatedAt`);

CREATE UNIQUE INDEX `FileStats_fileId_key` ON `FileStats` (`fileId`);

CREATE INDEX `FileStats_rating_idx` ON `FileStats` (`rating`);

CREATE INDEX `File_createdAt_idx` ON `File` (`createdAt`);

CREATE INDEX `File_fileType_idx` ON `File` (`fileType`);

CREATE INDEX `File_folderId_idx` ON `File` (`folderId`);

CREATE INDEX `File_hash_idx` ON `File` (`hash`);

CREATE INDEX `File_isFavorite_idx` ON `File` (`isFavorite`);

CREATE UNIQUE INDEX `File_path_key` ON `File` (`path`);

CREATE INDEX `File_processingStatus_idx` ON `File` (`processingStatus`);

CREATE INDEX `File_updatedAt_idx` ON `File` (`updatedAt`);

CREATE INDEX `Folder_createdAt_idx` ON `Folder` (`createdAt`);

CREATE INDEX `Folder_lastIndexed_idx` ON `Folder` (`lastIndexed`);

CREATE UNIQUE INDEX `Folder_path_key` ON `Folder` (`path`);

CREATE UNIQUE INDEX `Group_name_key` ON `Group` (`name`);

CREATE INDEX `Image_aiEngine_idx` ON `Image` (`aiEngine`);

CREATE INDEX `Image_aiOriginDetected_idx` ON `Image` (`aiOriginDetected`);

CREATE INDEX `Image_createdAt_idx` ON `Image` (`createdAt`);

CREATE INDEX `Image_folderId_idx` ON `Image` (`folderId`);

CREATE INDEX `Image_hash_idx` ON `Image` (`hash`);

CREATE INDEX `Image_isFavorite_idx` ON `Image` (`isFavorite`);

CREATE UNIQUE INDEX `Image_path_folderId_key` ON `Image` (`path`,`folderId`);

CREATE INDEX `Image_updatedAt_idx` ON `Image` (`updatedAt`);

CREATE INDEX `JsonFile_createdAt_idx` ON `JsonFile` (`createdAt`);

CREATE INDEX `JsonFile_folderId_idx` ON `JsonFile` (`folderId`);

CREATE INDEX `JsonFile_hash_idx` ON `JsonFile` (`hash`);

CREATE UNIQUE INDEX `JsonFile_path_key` ON `JsonFile` (`path`);

CREATE INDEX `JsonFile_updatedAt_idx` ON `JsonFile` (`updatedAt`);

CREATE INDEX `Metadata_entityType_entityId_idx` ON `Metadata` (`entityType`,`entityId`);

CREATE INDEX `Metadata_key_idx` ON `Metadata` (`key`);

CREATE UNIQUE INDEX `Note_title_key` ON `Note` (`title`);

CREATE UNIQUE INDEX `Place_name_key` ON `Place` (`name`);

CREATE UNIQUE INDEX `Prompt_name_key` ON `Prompt` (`name`);

CREATE UNIQUE INDEX `Property_name_key` ON `Property` (`name`);

CREATE INDEX `QueueJob_priority_status_createdAt_idx` ON `QueueJob` (`priority`,`status`,`createdAt`);

CREATE INDEX `QueueJob_queue_status_idx` ON `QueueJob` (`queue`,`status`);

CREATE INDEX `QueueJob_retryAt_idx` ON `QueueJob` (`retryAt`);

CREATE INDEX `QueueJob_status_createdAt_idx` ON `QueueJob` (`status`,`createdAt`);

CREATE UNIQUE INDEX `Settings_profileId_key` ON `Settings` (`profileId`);

CREATE UNIQUE INDEX `Tag_name_key` ON `Tag` (`name`);

CREATE UNIQUE INDEX `Thumbnail_entityType_entityId_size_key` ON `Thumbnail` (`entityType`,`entityId`,`size`);

CREATE UNIQUE INDEX `Thumbnail_path_key` ON `Thumbnail` (`path`);

CREATE INDEX `UploadedImage_category_idx` ON `UploadedImage` (`category`);

CREATE INDEX `UploadedImage_hash_idx` ON `UploadedImage` (`hash`);

CREATE INDEX `UploadedImage_imageId_idx` ON `UploadedImage` (`imageId`);

CREATE UNIQUE INDEX `UploadedImage_path_key` ON `UploadedImage` (`path`);

CREATE INDEX `UploadedImage_type_idx` ON `UploadedImage` (`type`);

CREATE INDEX `Video_createdAt_idx` ON `Video` (`createdAt`);

CREATE INDEX `Video_folderId_idx` ON `Video` (`folderId`);

CREATE INDEX `Video_hash_idx` ON `Video` (`hash`);

CREATE UNIQUE INDEX `Video_path_key` ON `Video` (`path`);

CREATE INDEX `Video_updatedAt_idx` ON `Video` (`updatedAt`);

CREATE UNIQUE INDEX `Wildcard_name_key` ON `Wildcard` (`name`);

CREATE UNIQUE INDEX `WorldItem_name_key` ON `WorldItem` (`name`);

CREATE UNIQUE INDEX `_AlbumToTask_AB_unique` ON `_AlbumToTask` (`A`,`B`);

CREATE INDEX `_AlbumToTask_B_index` ON `_AlbumToTask` (`B`);

CREATE UNIQUE INDEX `_CharacterToTask_AB_unique` ON `_CharacterToTask` (`A`,`B`);

CREATE INDEX `_CharacterToTask_B_index` ON `_CharacterToTask` (`B`);

CREATE UNIQUE INDEX `_GroupToAlbum_AB_unique` ON `_GroupToAlbum` (`A`,`B`);

CREATE INDEX `_GroupToAlbum_B_index` ON `_GroupToAlbum` (`B`);

CREATE UNIQUE INDEX `_GroupToImage_AB_unique` ON `_GroupToImage` (`A`,`B`);

CREATE INDEX `_GroupToImage_B_index` ON `_GroupToImage` (`B`);

CREATE UNIQUE INDEX `_GroupToTag_AB_unique` ON `_GroupToTag` (`A`,`B`);

CREATE INDEX `_GroupToTag_B_index` ON `_GroupToTag` (`B`);

CREATE UNIQUE INDEX `_GroupToVideo_AB_unique` ON `_GroupToVideo` (`A`,`B`);

CREATE INDEX `_GroupToVideo_B_index` ON `_GroupToVideo` (`B`);

CREATE UNIQUE INDEX `_ImageToAlbum_AB_unique` ON `_ImageToAlbum` (`A`,`B`);

CREATE INDEX `_ImageToAlbum_B_index` ON `_ImageToAlbum` (`B`);

CREATE UNIQUE INDEX `_ImageToCharacter_AB_unique` ON `_ImageToCharacter` (`A`,`B`);

CREATE INDEX `_ImageToCharacter_B_index` ON `_ImageToCharacter` (`B`);

CREATE UNIQUE INDEX `_ImageToCollection_AB_unique` ON `_ImageToCollection` (`A`,`B`);

CREATE INDEX `_ImageToCollection_B_index` ON `_ImageToCollection` (`B`);

CREATE UNIQUE INDEX `_ImageToConcept_AB_unique` ON `_ImageToConcept` (`A`,`B`);

CREATE INDEX `_ImageToConcept_B_index` ON `_ImageToConcept` (`B`);

CREATE UNIQUE INDEX `_ImageToNote_AB_unique` ON `_ImageToNote` (`A`,`B`);

CREATE INDEX `_ImageToNote_B_index` ON `_ImageToNote` (`B`);

CREATE UNIQUE INDEX `_ImageToPlace_AB_unique` ON `_ImageToPlace` (`A`,`B`);

CREATE INDEX `_ImageToPlace_B_index` ON `_ImageToPlace` (`B`);

CREATE UNIQUE INDEX `_ImageToPrompt_AB_unique` ON `_ImageToPrompt` (`A`,`B`);

CREATE INDEX `_ImageToPrompt_B_index` ON `_ImageToPrompt` (`B`);

CREATE UNIQUE INDEX `_ImageToProperty_AB_unique` ON `_ImageToProperty` (`A`,`B`);

CREATE INDEX `_ImageToProperty_B_index` ON `_ImageToProperty` (`B`);

CREATE UNIQUE INDEX `_ImageToTag_AB_unique` ON `_ImageToTag` (`A`,`B`);

CREATE INDEX `_ImageToTag_B_index` ON `_ImageToTag` (`B`);

CREATE UNIQUE INDEX `_ImageToTask_AB_unique` ON `_ImageToTask` (`A`,`B`);

CREATE INDEX `_ImageToTask_B_index` ON `_ImageToTask` (`B`);

CREATE UNIQUE INDEX `_ImageToWildcard_AB_unique` ON `_ImageToWildcard` (`A`,`B`);

CREATE INDEX `_ImageToWildcard_B_index` ON `_ImageToWildcard` (`B`);

CREATE UNIQUE INDEX `_ImageToWorldItem_AB_unique` ON `_ImageToWorldItem` (`A`,`B`);

CREATE INDEX `_ImageToWorldItem_B_index` ON `_ImageToWorldItem` (`B`);

CREATE UNIQUE INDEX `_VideoToAlbum_AB_unique` ON `_VideoToAlbum` (`A`,`B`);

CREATE INDEX `_VideoToAlbum_B_index` ON `_VideoToAlbum` (`B`);

CREATE UNIQUE INDEX `_VideoToCharacter_AB_unique` ON `_VideoToCharacter` (`A`,`B`);

CREATE INDEX `_VideoToCharacter_B_index` ON `_VideoToCharacter` (`B`);

CREATE UNIQUE INDEX `_VideoToCollection_AB_unique` ON `_VideoToCollection` (`A`,`B`);

CREATE INDEX `_VideoToCollection_B_index` ON `_VideoToCollection` (`B`);

CREATE UNIQUE INDEX `_VideoToConcept_AB_unique` ON `_VideoToConcept` (`A`,`B`);

CREATE INDEX `_VideoToConcept_B_index` ON `_VideoToConcept` (`B`);

CREATE UNIQUE INDEX `_VideoToNote_AB_unique` ON `_VideoToNote` (`A`,`B`);

CREATE INDEX `_VideoToNote_B_index` ON `_VideoToNote` (`B`);

CREATE UNIQUE INDEX `_VideoToPlace_AB_unique` ON `_VideoToPlace` (`A`,`B`);

CREATE INDEX `_VideoToPlace_B_index` ON `_VideoToPlace` (`B`);

CREATE UNIQUE INDEX `_VideoToPrompt_AB_unique` ON `_VideoToPrompt` (`A`,`B`);

CREATE INDEX `_VideoToPrompt_B_index` ON `_VideoToPrompt` (`B`);

CREATE UNIQUE INDEX `_VideoToProperty_AB_unique` ON `_VideoToProperty` (`A`,`B`);

CREATE INDEX `_VideoToProperty_B_index` ON `_VideoToProperty` (`B`);

CREATE UNIQUE INDEX `_VideoToTag_AB_unique` ON `_VideoToTag` (`A`,`B`);

CREATE INDEX `_VideoToTag_B_index` ON `_VideoToTag` (`B`);

CREATE UNIQUE INDEX `_VideoToTask_AB_unique` ON `_VideoToTask` (`A`,`B`);

CREATE INDEX `_VideoToTask_B_index` ON `_VideoToTask` (`B`);

CREATE UNIQUE INDEX `_VideoToWildcard_AB_unique` ON `_VideoToWildcard` (`A`,`B`);

CREATE INDEX `_VideoToWildcard_B_index` ON `_VideoToWildcard` (`B`);

CREATE UNIQUE INDEX `_VideoToWorldItem_AB_unique` ON `_VideoToWorldItem` (`A`,`B`);

CREATE INDEX `_VideoToWorldItem_B_index` ON `_VideoToWorldItem` (`B`);

CREATE INDEX `alert_level_idx` ON `server_alerts` (`level`);

CREATE INDEX `alert_resolved_idx` ON `server_alerts` (`resolved`);

CREATE INDEX `alert_service_idx` ON `server_alerts` (`service`);

CREATE INDEX `feature_status_idx` ON `dev_features` (`status`);

CREATE TRIGGER images_ai AFTER INSERT ON Image BEGIN
  INSERT INTO media_fts(rowid, name, content, entity_type, entity_id)
  VALUES (
    (SELECT COALESCE(MAX(rowid), 0) + 1 FROM media_fts),
    new.name,
    (new.name || ' ' || new.path || ' ' || COALESCE(new.description, '')),
    'image',
    new.id
  );
END;
