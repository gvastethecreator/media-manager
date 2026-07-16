-- media-manager: foreign-keys-off
-- Las tablas puente no tienen propiedad propia: sus enlaces inválidos se eliminan de forma explícita
-- antes de reconstruirlas. Las relaciones directas y polimórficas no se reparan por inferencia.
DELETE FROM `_ImageToAlbum` WHERE NOT EXISTS (SELECT 1 FROM `Image` WHERE `Image`.`id` = `_ImageToAlbum`.`A`) OR NOT EXISTS (SELECT 1 FROM `Album` WHERE `Album`.`id` = `_ImageToAlbum`.`B`);--> statement-breakpoint
DELETE FROM `_VideoToAlbum` WHERE NOT EXISTS (SELECT 1 FROM `Video` WHERE `Video`.`id` = `_VideoToAlbum`.`A`) OR NOT EXISTS (SELECT 1 FROM `Album` WHERE `Album`.`id` = `_VideoToAlbum`.`B`);--> statement-breakpoint
DELETE FROM `_ImageToCollection` WHERE NOT EXISTS (SELECT 1 FROM `Image` WHERE `Image`.`id` = `_ImageToCollection`.`A`) OR NOT EXISTS (SELECT 1 FROM `Collection` WHERE `Collection`.`id` = `_ImageToCollection`.`B`);--> statement-breakpoint
DELETE FROM `_VideoToCollection` WHERE NOT EXISTS (SELECT 1 FROM `Video` WHERE `Video`.`id` = `_VideoToCollection`.`A`) OR NOT EXISTS (SELECT 1 FROM `Collection` WHERE `Collection`.`id` = `_VideoToCollection`.`B`);--> statement-breakpoint
DELETE FROM `_ImageToTag` WHERE NOT EXISTS (SELECT 1 FROM `Image` WHERE `Image`.`id` = `_ImageToTag`.`A`) OR NOT EXISTS (SELECT 1 FROM `Tag` WHERE `Tag`.`id` = `_ImageToTag`.`B`);--> statement-breakpoint
DELETE FROM `_VideoToTag` WHERE NOT EXISTS (SELECT 1 FROM `Video` WHERE `Video`.`id` = `_VideoToTag`.`A`) OR NOT EXISTS (SELECT 1 FROM `Tag` WHERE `Tag`.`id` = `_VideoToTag`.`B`);--> statement-breakpoint
DELETE FROM `_ImageToProperty` WHERE NOT EXISTS (SELECT 1 FROM `Image` WHERE `Image`.`id` = `_ImageToProperty`.`A`) OR NOT EXISTS (SELECT 1 FROM `Property` WHERE `Property`.`id` = `_ImageToProperty`.`B`);--> statement-breakpoint
DELETE FROM `_VideoToProperty` WHERE NOT EXISTS (SELECT 1 FROM `Video` WHERE `Video`.`id` = `_VideoToProperty`.`A`) OR NOT EXISTS (SELECT 1 FROM `Property` WHERE `Property`.`id` = `_VideoToProperty`.`B`);--> statement-breakpoint
DELETE FROM `_ImageToWildcard` WHERE NOT EXISTS (SELECT 1 FROM `Image` WHERE `Image`.`id` = `_ImageToWildcard`.`A`) OR NOT EXISTS (SELECT 1 FROM `Wildcard` WHERE `Wildcard`.`id` = `_ImageToWildcard`.`B`);--> statement-breakpoint
DELETE FROM `_VideoToWildcard` WHERE NOT EXISTS (SELECT 1 FROM `Video` WHERE `Video`.`id` = `_VideoToWildcard`.`A`) OR NOT EXISTS (SELECT 1 FROM `Wildcard` WHERE `Wildcard`.`id` = `_VideoToWildcard`.`B`);--> statement-breakpoint
DELETE FROM `_ImageToCharacter` WHERE NOT EXISTS (SELECT 1 FROM `Image` WHERE `Image`.`id` = `_ImageToCharacter`.`A`) OR NOT EXISTS (SELECT 1 FROM `Character` WHERE `Character`.`id` = `_ImageToCharacter`.`B`);--> statement-breakpoint
DELETE FROM `_VideoToCharacter` WHERE NOT EXISTS (SELECT 1 FROM `Video` WHERE `Video`.`id` = `_VideoToCharacter`.`A`) OR NOT EXISTS (SELECT 1 FROM `Character` WHERE `Character`.`id` = `_VideoToCharacter`.`B`);--> statement-breakpoint
DELETE FROM `_ImageToPlace` WHERE NOT EXISTS (SELECT 1 FROM `Image` WHERE `Image`.`id` = `_ImageToPlace`.`A`) OR NOT EXISTS (SELECT 1 FROM `Place` WHERE `Place`.`id` = `_ImageToPlace`.`B`);--> statement-breakpoint
DELETE FROM `_VideoToPlace` WHERE NOT EXISTS (SELECT 1 FROM `Video` WHERE `Video`.`id` = `_VideoToPlace`.`A`) OR NOT EXISTS (SELECT 1 FROM `Place` WHERE `Place`.`id` = `_VideoToPlace`.`B`);--> statement-breakpoint
DELETE FROM `_ImageToWorldItem` WHERE NOT EXISTS (SELECT 1 FROM `Image` WHERE `Image`.`id` = `_ImageToWorldItem`.`A`) OR NOT EXISTS (SELECT 1 FROM `WorldItem` WHERE `WorldItem`.`id` = `_ImageToWorldItem`.`B`);--> statement-breakpoint
DELETE FROM `_VideoToWorldItem` WHERE NOT EXISTS (SELECT 1 FROM `Video` WHERE `Video`.`id` = `_VideoToWorldItem`.`A`) OR NOT EXISTS (SELECT 1 FROM `WorldItem` WHERE `WorldItem`.`id` = `_VideoToWorldItem`.`B`);--> statement-breakpoint
DELETE FROM `_ImageToConcept` WHERE NOT EXISTS (SELECT 1 FROM `Image` WHERE `Image`.`id` = `_ImageToConcept`.`A`) OR NOT EXISTS (SELECT 1 FROM `Concept` WHERE `Concept`.`id` = `_ImageToConcept`.`B`);--> statement-breakpoint
DELETE FROM `_VideoToConcept` WHERE NOT EXISTS (SELECT 1 FROM `Video` WHERE `Video`.`id` = `_VideoToConcept`.`A`) OR NOT EXISTS (SELECT 1 FROM `Concept` WHERE `Concept`.`id` = `_VideoToConcept`.`B`);--> statement-breakpoint
DELETE FROM `_ImageToPrompt` WHERE NOT EXISTS (SELECT 1 FROM `Image` WHERE `Image`.`id` = `_ImageToPrompt`.`A`) OR NOT EXISTS (SELECT 1 FROM `Prompt` WHERE `Prompt`.`id` = `_ImageToPrompt`.`B`);--> statement-breakpoint
DELETE FROM `_VideoToPrompt` WHERE NOT EXISTS (SELECT 1 FROM `Video` WHERE `Video`.`id` = `_VideoToPrompt`.`A`) OR NOT EXISTS (SELECT 1 FROM `Prompt` WHERE `Prompt`.`id` = `_VideoToPrompt`.`B`);--> statement-breakpoint
DELETE FROM `_ImageToNote` WHERE NOT EXISTS (SELECT 1 FROM `Image` WHERE `Image`.`id` = `_ImageToNote`.`A`) OR NOT EXISTS (SELECT 1 FROM `Note` WHERE `Note`.`id` = `_ImageToNote`.`B`);--> statement-breakpoint
DELETE FROM `_VideoToNote` WHERE NOT EXISTS (SELECT 1 FROM `Video` WHERE `Video`.`id` = `_VideoToNote`.`A`) OR NOT EXISTS (SELECT 1 FROM `Note` WHERE `Note`.`id` = `_VideoToNote`.`B`);--> statement-breakpoint
DELETE FROM `_GroupToImage` WHERE NOT EXISTS (SELECT 1 FROM `Group` WHERE `Group`.`id` = `_GroupToImage`.`A`) OR NOT EXISTS (SELECT 1 FROM `Image` WHERE `Image`.`id` = `_GroupToImage`.`B`);--> statement-breakpoint
DELETE FROM `_GroupToVideo` WHERE NOT EXISTS (SELECT 1 FROM `Group` WHERE `Group`.`id` = `_GroupToVideo`.`A`) OR NOT EXISTS (SELECT 1 FROM `Video` WHERE `Video`.`id` = `_GroupToVideo`.`B`);--> statement-breakpoint
DELETE FROM `_GroupToAlbum` WHERE NOT EXISTS (SELECT 1 FROM `Group` WHERE `Group`.`id` = `_GroupToAlbum`.`A`) OR NOT EXISTS (SELECT 1 FROM `Album` WHERE `Album`.`id` = `_GroupToAlbum`.`B`);--> statement-breakpoint
DELETE FROM `_GroupToTag` WHERE NOT EXISTS (SELECT 1 FROM `Group` WHERE `Group`.`id` = `_GroupToTag`.`A`) OR NOT EXISTS (SELECT 1 FROM `Tag` WHERE `Tag`.`id` = `_GroupToTag`.`B`);--> statement-breakpoint
CREATE TABLE `_AlbumToPlace` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Album`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `Place`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `_AlbumToPlace_AB_unique` ON `_AlbumToPlace` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_AlbumToPlace_B_index` ON `_AlbumToPlace` (`B`);--> statement-breakpoint
CREATE TABLE `_CharacterToPlace` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Character`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `Place`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `_CharacterToPlace_AB_unique` ON `_CharacterToPlace` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_CharacterToPlace_B_index` ON `_CharacterToPlace` (`B`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_Activity` (
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
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_Activity`("id", "type", "entityType", "entityId", "userId", "action", "description", "metadata", "ipAddress", "userAgent", "sessionId", "createdAt") SELECT "id", "type", "entityType", "entityId", "userId", "action", "description", "metadata", "ipAddress", "userAgent", "sessionId", "createdAt" FROM `Activity`;--> statement-breakpoint
DROP TABLE `Activity`;--> statement-breakpoint
ALTER TABLE `__new_Activity` RENAME TO `Activity`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `Activity_type_idx` ON `Activity` (`type`);--> statement-breakpoint
CREATE INDEX `Activity_entityType_idx` ON `Activity` (`entityType`);--> statement-breakpoint
CREATE INDEX `Activity_entityId_idx` ON `Activity` (`entityId`);--> statement-breakpoint
CREATE INDEX `Activity_userId_idx` ON `Activity` (`userId`);--> statement-breakpoint
CREATE INDEX `Activity_action_idx` ON `Activity` (`action`);--> statement-breakpoint
CREATE INDEX `Activity_createdAt_idx` ON `Activity` (`createdAt`);--> statement-breakpoint
CREATE TABLE `__new_Album` (
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
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer
);
--> statement-breakpoint
INSERT INTO `__new_Album`("id", "name", "description", "emoji", "color", "featuredImage", "isFavorite", "filters", "category", "metadata", "lastImageAddedAt", "lastVideoAddedAt", "createdAt", "updatedAt") SELECT "id", "name", "description", "emoji", "color", "featuredImage", "isFavorite", "filters", "category", "metadata", "lastImageAddedAt", "lastVideoAddedAt", "createdAt", "updatedAt" FROM `Album`;--> statement-breakpoint
DROP TABLE `Album`;--> statement-breakpoint
ALTER TABLE `__new_Album` RENAME TO `Album`;--> statement-breakpoint
CREATE UNIQUE INDEX `Album_name_key` ON `Album` (`name`);--> statement-breakpoint
CREATE TABLE `__new_Audio` (
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
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`folderId`) REFERENCES `Folder`(`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "Audio_size_check" CHECK(size >= 0 AND size <= 107374182400),
	CONSTRAINT "Audio_duration_check" CHECK(duration IS NULL OR duration >= 0),
	CONSTRAINT "Audio_hash_format_check" CHECK(length(hash) = 64),
	CONSTRAINT "Audio_path_length_check" CHECK(length(path) BETWEEN 1 AND 1000),
	CONSTRAINT "Audio_numeric_metadata_check" CHECK((bitrate IS NULL OR bitrate >= 0) AND (sampleRate IS NULL OR sampleRate >= 0) AND (channels IS NULL OR channels >= 0) AND (track IS NULL OR track >= 0) AND (disc IS NULL OR disc >= 0) AND (bpm IS NULL OR bpm >= 0))
);
--> statement-breakpoint
INSERT INTO `__new_Audio`("id", "name", "path", "size", "hash", "mimeType", "extension", "folderId", "isFavorite", "isArchived", "duration", "bitrate", "sampleRate", "channels", "format", "codec", "title", "artist", "album", "year", "genre", "track", "disc", "albumArtist", "composer", "comment", "lyrics", "bpm", "key", "mood", "metadata", "createdAt", "updatedAt") SELECT "id", "name", "path", "size", "hash", "mimeType", "extension", "folderId", "isFavorite", "isArchived", "duration", "bitrate", "sampleRate", "channels", "format", "codec", "title", "artist", "album", "year", "genre", "track", "disc", "albumArtist", "composer", "comment", "lyrics", "bpm", "key", "mood", "metadata", "createdAt", "updatedAt" FROM `Audio`;--> statement-breakpoint
DROP TABLE `Audio`;--> statement-breakpoint
ALTER TABLE `__new_Audio` RENAME TO `Audio`;--> statement-breakpoint
CREATE UNIQUE INDEX `Audio_path_key` ON `Audio` (`path`);--> statement-breakpoint
CREATE INDEX `Audio_folderId_idx` ON `Audio` (`folderId`);--> statement-breakpoint
CREATE INDEX `Audio_hash_idx` ON `Audio` (`hash`);--> statement-breakpoint
CREATE INDEX `Audio_folderId_hash_idx` ON `Audio` (`folderId`,`hash`);--> statement-breakpoint
CREATE INDEX `Audio_createdAt_idx` ON `Audio` (`createdAt`);--> statement-breakpoint
CREATE INDEX `Audio_updatedAt_idx` ON `Audio` (`updatedAt`);--> statement-breakpoint
CREATE TABLE `__new_Character` (
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
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`parentId`) REFERENCES `Character`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_Character`("id", "name", "description", "emoji", "color", "category", "filters", "isFavorite", "metadata", "age", "gender", "species", "occupation", "personality", "background", "relationships", "skills", "equipment", "notes", "featuredImage", "parentId", "createdAt", "updatedAt") SELECT "id", "name", "description", "emoji", "color", "category", "filters", "isFavorite", "metadata", "age", "gender", "species", "occupation", "personality", "background", "relationships", "skills", "equipment", "notes", "featuredImage", "parentId", "createdAt", "updatedAt" FROM `Character`;--> statement-breakpoint
DROP TABLE `Character`;--> statement-breakpoint
ALTER TABLE `__new_Character` RENAME TO `Character`;--> statement-breakpoint
CREATE UNIQUE INDEX `Character_name_key` ON `Character` (`name`);--> statement-breakpoint
CREATE INDEX `Character_parentId_idx` ON `Character` (`parentId`);--> statement-breakpoint
CREATE TABLE `__new_Collection` (
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
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`parentId`) REFERENCES `Collection`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_Collection`("id", "name", "description", "emoji", "color", "featuredImage", "isFavorite", "lastImageAddedAt", "lastVideoAddedAt", "parentId", "createdAt", "updatedAt") SELECT "id", "name", "description", "emoji", "color", "featuredImage", "isFavorite", "lastImageAddedAt", "lastVideoAddedAt", "parentId", "createdAt", "updatedAt" FROM `Collection`;--> statement-breakpoint
DROP TABLE `Collection`;--> statement-breakpoint
ALTER TABLE `__new_Collection` RENAME TO `Collection`;--> statement-breakpoint
CREATE UNIQUE INDEX `Collection_name_key` ON `Collection` (`name`);--> statement-breakpoint
CREATE INDEX `Collection_parentId_idx` ON `Collection` (`parentId`);--> statement-breakpoint
CREATE TABLE `__new_Concept` (
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
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`parentId`) REFERENCES `Concept`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_Concept`("id", "name", "description", "emoji", "color", "category", "filters", "isFavorite", "metadata", "type", "complexity", "applications", "examples", "relatedConcepts", "notes", "featuredImage", "parentId", "createdAt", "updatedAt") SELECT "id", "name", "description", "emoji", "color", "category", "filters", "isFavorite", "metadata", "type", "complexity", "applications", "examples", "relatedConcepts", "notes", "featuredImage", "parentId", "createdAt", "updatedAt" FROM `Concept`;--> statement-breakpoint
DROP TABLE `Concept`;--> statement-breakpoint
ALTER TABLE `__new_Concept` RENAME TO `Concept`;--> statement-breakpoint
CREATE UNIQUE INDEX `Concept_name_key` ON `Concept` (`name`);--> statement-breakpoint
CREATE INDEX `Concept_parentId_idx` ON `Concept` (`parentId`);--> statement-breakpoint
CREATE TABLE `__new_Document` (
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
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`folderId`) REFERENCES `Folder`(`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "Document_size_check" CHECK(size >= 0 AND size <= 107374182400),
	CONSTRAINT "Document_hash_format_check" CHECK(length(hash) = 64),
	CONSTRAINT "Document_path_length_check" CHECK(length(path) BETWEEN 1 AND 1000),
	CONSTRAINT "Document_page_count_check" CHECK(pageCount IS NULL OR pageCount >= 0),
	CONSTRAINT "Document_word_count_check" CHECK(wordCount IS NULL OR wordCount >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_Document`("id", "name", "path", "size", "hash", "mimeType", "extension", "thumbnail", "thumbnailSize", "thumbnailWidth", "thumbnailHeight", "thumbnailMimeType", "thumbnailError", "thumbnailErrorAt", "folderId", "isFavorite", "isArchived", "pageCount", "wordCount", "language", "title", "author", "subject", "keywords", "creator", "producer", "creationDate", "modificationDate", "encrypted", "version", "content", "summary", "createdAt", "updatedAt") SELECT "id", "name", "path", "size", "hash", "mimeType", "extension", "thumbnail", "thumbnailSize", "thumbnailWidth", "thumbnailHeight", "thumbnailMimeType", "thumbnailError", "thumbnailErrorAt", "folderId", "isFavorite", "isArchived", "pageCount", "wordCount", "language", "title", "author", "subject", "keywords", "creator", "producer", "creationDate", "modificationDate", "encrypted", "version", "content", "summary", "createdAt", "updatedAt" FROM `Document`;--> statement-breakpoint
DROP TABLE `Document`;--> statement-breakpoint
ALTER TABLE `__new_Document` RENAME TO `Document`;--> statement-breakpoint
CREATE UNIQUE INDEX `Document_path_key` ON `Document` (`path`);--> statement-breakpoint
CREATE INDEX `Document_folderId_idx` ON `Document` (`folderId`);--> statement-breakpoint
CREATE INDEX `Document_hash_idx` ON `Document` (`hash`);--> statement-breakpoint
CREATE INDEX `Document_folderId_hash_idx` ON `Document` (`folderId`,`hash`);--> statement-breakpoint
CREATE INDEX `Document_createdAt_idx` ON `Document` (`createdAt`);--> statement-breakpoint
CREATE INDEX `Document_updatedAt_idx` ON `Document` (`updatedAt`);--> statement-breakpoint
CREATE TABLE `__new_EntityAggregates` (
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
	`lastIndexed` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)),
	`updatedAt` integer,
	PRIMARY KEY(`entityType`, `entityId`)
);
--> statement-breakpoint
INSERT INTO `__new_EntityAggregates`("entityType", "entityId", "totalImages", "totalVideos", "totalAudio", "totalDocuments", "totalJsonFiles", "totalFile3D", "totalFiles", "totalSize", "lastIndexed", "updatedAt") SELECT "entityType", "entityId", "totalImages", "totalVideos", "totalAudio", "totalDocuments", "totalJsonFiles", "totalFile3D", "totalFiles", "totalSize", "lastIndexed", "updatedAt" FROM `EntityAggregates`;--> statement-breakpoint
DROP TABLE `EntityAggregates`;--> statement-breakpoint
ALTER TABLE `__new_EntityAggregates` RENAME TO `EntityAggregates`;--> statement-breakpoint
CREATE INDEX `EntityAggregates_lastIndexed_idx` ON `EntityAggregates` (`lastIndexed`);--> statement-breakpoint
CREATE TABLE `__new_Favorite` (
	`id` text PRIMARY KEY NOT NULL,
	`profileId` text NOT NULL,
	`entityType` text NOT NULL,
	`entityId` text NOT NULL,
	`addedAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	FOREIGN KEY (`profileId`) REFERENCES `Profile`(`id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "Favorite_entity_type_check" CHECK(entityType IN ('image', 'video', 'audio', 'document', 'jsonFile', 'file3d', 'album', 'collection', 'folder', 'group', 'tag', 'character', 'place', 'worldItem', 'concept', 'property', 'prompt', 'note', 'wildcard'))
);
--> statement-breakpoint
INSERT INTO `__new_Favorite`("id", "profileId", "entityType", "entityId", "addedAt") SELECT "id", "profileId", CASE lower("entityType") WHEN 'jsonfile' THEN 'jsonFile' WHEN 'worlditem' THEN 'worldItem' ELSE lower("entityType") END, "entityId", "addedAt" FROM `Favorite`;--> statement-breakpoint
DROP TABLE `Favorite`;--> statement-breakpoint
ALTER TABLE `__new_Favorite` RENAME TO `Favorite`;--> statement-breakpoint
CREATE UNIQUE INDEX `Favorite_profileId_entityType_entityId_key` ON `Favorite` (`profileId`,`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `Favorite_profileId_idx` ON `Favorite` (`profileId`);--> statement-breakpoint
CREATE INDEX `Favorite_profileId_addedAt_idx` ON `Favorite` (`profileId`,`addedAt`);--> statement-breakpoint
CREATE INDEX `Favorite_entityType_idx` ON `Favorite` (`entityType`);--> statement-breakpoint
CREATE INDEX `Favorite_addedAt_idx` ON `Favorite` (`addedAt`);--> statement-breakpoint
CREATE TABLE `__new_File3D` (
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
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`folderId`) REFERENCES `Folder`(`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "File3D_size_check" CHECK(size >= 0 AND size <= 107374182400),
	CONSTRAINT "File3D_hash_format_check" CHECK(length(hash) = 64),
	CONSTRAINT "File3D_path_length_check" CHECK(length(path) BETWEEN 1 AND 1000),
	CONSTRAINT "File3D_geometry_counts_check" CHECK((vertices IS NULL OR vertices >= 0) AND (faces IS NULL OR faces >= 0) AND (triangles IS NULL OR triangles >= 0) AND (materials IS NULL OR materials >= 0) AND (textures IS NULL OR textures >= 0) AND (animations IS NULL OR animations >= 0) AND (bones IS NULL OR bones >= 0) AND (scenes IS NULL OR scenes >= 0) AND (cameras IS NULL OR cameras >= 0) AND (lights IS NULL OR lights >= 0))
);
--> statement-breakpoint
INSERT INTO `__new_File3D`("id", "name", "path", "size", "hash", "mimeType", "extension", "folderId", "isFavorite", "isArchived", "format", "version", "vertices", "faces", "triangles", "materials", "textures", "animations", "bones", "scenes", "cameras", "lights", "hasUV", "hasNormals", "hasColors", "boundingBox", "metadata", "createdAt", "updatedAt") SELECT "id", "name", "path", "size", "hash", "mimeType", "extension", "folderId", "isFavorite", "isArchived", "format", "version", "vertices", "faces", "triangles", "materials", "textures", "animations", "bones", "scenes", "cameras", "lights", "hasUV", "hasNormals", "hasColors", "boundingBox", "metadata", "createdAt", "updatedAt" FROM `File3D`;--> statement-breakpoint
DROP TABLE `File3D`;--> statement-breakpoint
ALTER TABLE `__new_File3D` RENAME TO `File3D`;--> statement-breakpoint
CREATE UNIQUE INDEX `File3D_path_key` ON `File3D` (`path`);--> statement-breakpoint
CREATE INDEX `File3D_folderId_idx` ON `File3D` (`folderId`);--> statement-breakpoint
CREATE INDEX `File3D_hash_idx` ON `File3D` (`hash`);--> statement-breakpoint
CREATE INDEX `File3D_folderId_hash_idx` ON `File3D` (`folderId`,`hash`);--> statement-breakpoint
CREATE INDEX `File3D_createdAt_idx` ON `File3D` (`createdAt`);--> statement-breakpoint
CREATE INDEX `File3D_updatedAt_idx` ON `File3D` (`updatedAt`);--> statement-breakpoint
CREATE TABLE `__new_FileStats` (
	`id` text PRIMARY KEY NOT NULL,
	`fileId` text NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`rating` integer DEFAULT 0,
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`fileId`) REFERENCES `Image`(`id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "FileStats_views_check" CHECK(views >= 0),
	CONSTRAINT "FileStats_rating_check" CHECK(rating IS NULL OR rating BETWEEN 0 AND 5)
);
--> statement-breakpoint
INSERT INTO `__new_FileStats`("id", "fileId", "views", "rating", "createdAt", "updatedAt") SELECT "id", "fileId", "views", "rating", "createdAt", "updatedAt" FROM `FileStats`;--> statement-breakpoint
DROP TABLE `FileStats`;--> statement-breakpoint
ALTER TABLE `__new_FileStats` RENAME TO `FileStats`;--> statement-breakpoint
CREATE UNIQUE INDEX `FileStats_fileId_key` ON `FileStats` (`fileId`);--> statement-breakpoint
CREATE INDEX `FileStats_rating_idx` ON `FileStats` (`rating`);--> statement-breakpoint
CREATE TABLE `__new_File` (
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
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`folderId`) REFERENCES `Folder`(`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "File_size_check" CHECK(size >= 0 AND size <= 107374182400),
	CONSTRAINT "File_hash_format_check" CHECK(length(hash) = 64),
	CONSTRAINT "File_path_length_check" CHECK(length(path) BETWEEN 1 AND 1000),
	CONSTRAINT "File_access_count_check" CHECK(accessCount IS NULL OR accessCount >= 0),
	CONSTRAINT "File_processing_status_check" CHECK(processingStatus IS NULL OR processingStatus IN ('pending', 'processing', 'completed', 'failed'))
);
--> statement-breakpoint
INSERT INTO `__new_File`("id", "name", "path", "size", "hash", "mimeType", "extension", "fileType", "folderId", "isFavorite", "isArchived", "description", "tags", "metadata", "lastAccessed", "accessCount", "isProcessed", "processingError", "processingStatus", "createdAt", "updatedAt") SELECT "id", "name", "path", "size", "hash", "mimeType", "extension", "fileType", "folderId", "isFavorite", "isArchived", "description", "tags", "metadata", "lastAccessed", "accessCount", "isProcessed", "processingError", "processingStatus", "createdAt", "updatedAt" FROM `File`;--> statement-breakpoint
DROP TABLE `File`;--> statement-breakpoint
ALTER TABLE `__new_File` RENAME TO `File`;--> statement-breakpoint
CREATE UNIQUE INDEX `File_path_key` ON `File` (`path`);--> statement-breakpoint
CREATE INDEX `File_folderId_idx` ON `File` (`folderId`);--> statement-breakpoint
CREATE INDEX `File_hash_idx` ON `File` (`hash`);--> statement-breakpoint
CREATE INDEX `File_folderId_hash_idx` ON `File` (`folderId`,`hash`);--> statement-breakpoint
CREATE INDEX `File_fileType_idx` ON `File` (`fileType`);--> statement-breakpoint
CREATE INDEX `File_createdAt_idx` ON `File` (`createdAt`);--> statement-breakpoint
CREATE INDEX `File_updatedAt_idx` ON `File` (`updatedAt`);--> statement-breakpoint
CREATE INDEX `File_isFavorite_idx` ON `File` (`isFavorite`);--> statement-breakpoint
CREATE INDEX `File_processingStatus_idx` ON `File` (`processingStatus`);--> statement-breakpoint
CREATE TABLE `__new_Folder` (
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
	`lastIndexed` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)),
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	`parentId` text,
	`presetId` text,
	FOREIGN KEY (`parentId`) REFERENCES `Folder`(`id`) ON UPDATE cascade ON DELETE set null,
	CONSTRAINT "Folder_path_length_check" CHECK(length(path) BETWEEN 1 AND 1000),
	CONSTRAINT "Folder_name_length_check" CHECK(length(name) BETWEEN 1 AND 255),
	CONSTRAINT "Folder_color_format_check" CHECK(color IS NULL OR (color LIKE '#%' AND length(color) = 7)),
	CONSTRAINT "Folder_total_files_check" CHECK(totalFiles >= 0),
	CONSTRAINT "Folder_total_size_check" CHECK(totalSize >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_Folder`("id", "name", "description", "path", "emoji", "color", "featuredImage", "isFavorite", "totalImages", "totalVideos", "totalFiles", "totalSize", "lastIndexed", "createdAt", "updatedAt", "parentId", "presetId") SELECT "id", "name", "description", "path", "emoji", "color", "featuredImage", "isFavorite", "totalImages", "totalVideos", "totalFiles", "totalSize", "lastIndexed", "createdAt", "updatedAt", "parentId", "presetId" FROM `Folder`;--> statement-breakpoint
DROP TABLE `Folder`;--> statement-breakpoint
ALTER TABLE `__new_Folder` RENAME TO `Folder`;--> statement-breakpoint
CREATE UNIQUE INDEX `Folder_path_key` ON `Folder` (`path`);--> statement-breakpoint
CREATE INDEX `Folder_lastIndexed_idx` ON `Folder` (`lastIndexed`);--> statement-breakpoint
CREATE INDEX `Folder_createdAt_idx` ON `Folder` (`createdAt`);--> statement-breakpoint
CREATE INDEX `Folder_parentId_idx` ON `Folder` (`parentId`);--> statement-breakpoint
CREATE TABLE `__new_Group` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer
);
--> statement-breakpoint
INSERT INTO `__new_Group`("id", "name", "description", "createdAt", "updatedAt") SELECT "id", "name", "description", "createdAt", "updatedAt" FROM `Group`;--> statement-breakpoint
DROP TABLE `Group`;--> statement-breakpoint
ALTER TABLE `__new_Group` RENAME TO `Group`;--> statement-breakpoint
CREATE UNIQUE INDEX `Group_name_key` ON `Group` (`name`);--> statement-breakpoint
CREATE TABLE `__new_Image` (
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
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	`addedAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	FOREIGN KEY (`folderId`) REFERENCES `Folder`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`noteId`) REFERENCES `Note`(`id`) ON UPDATE cascade ON DELETE set null,
	CONSTRAINT "Image_size_check" CHECK(size >= 0 AND size <= 107374182400),
	CONSTRAINT "Image_dimensions_check" CHECK(width > 0 AND width <= 32768 AND height > 0 AND height <= 32768),
	CONSTRAINT "Image_hash_format_check" CHECK(length(hash) = 64),
	CONSTRAINT "Image_path_length_check" CHECK(length(path) BETWEEN 1 AND 1000)
);
--> statement-breakpoint
INSERT INTO `__new_Image`("id", "name", "description", "path", "hash", "size", "width", "height", "metadata", "thumbnail", "thumbnailSize", "thumbnailWidth", "thumbnailHeight", "thumbnailMimeType", "thumbnailError", "thumbnailErrorAt", "thumbnailOptimizedAt", "aiEngine", "aiModel", "aiOriginDetected", "isFavorite", "folderId", "noteId", "createdAt", "updatedAt", "addedAt") SELECT "id", "name", "description", "path", "hash", "size", "width", "height", "metadata", "thumbnail", "thumbnailSize", "thumbnailWidth", "thumbnailHeight", "thumbnailMimeType", "thumbnailError", "thumbnailErrorAt", "thumbnailOptimizedAt", "aiEngine", "aiModel", "aiOriginDetected", "isFavorite", "folderId", "noteId", "createdAt", "updatedAt", "addedAt" FROM `Image`;--> statement-breakpoint
DROP TABLE `Image`;--> statement-breakpoint
ALTER TABLE `__new_Image` RENAME TO `Image`;--> statement-breakpoint
CREATE UNIQUE INDEX `Image_path_folderId_key` ON `Image` (`path`,`folderId`);--> statement-breakpoint
CREATE INDEX `Image_folderId_idx` ON `Image` (`folderId`);--> statement-breakpoint
CREATE INDEX `Image_hash_idx` ON `Image` (`hash`);--> statement-breakpoint
CREATE INDEX `Image_folderId_hash_idx` ON `Image` (`folderId`,`hash`);--> statement-breakpoint
CREATE INDEX `Image_createdAt_idx` ON `Image` (`createdAt`);--> statement-breakpoint
CREATE INDEX `Image_updatedAt_idx` ON `Image` (`updatedAt`);--> statement-breakpoint
CREATE INDEX `Image_isFavorite_idx` ON `Image` (`isFavorite`);--> statement-breakpoint
CREATE INDEX `Image_aiEngine_idx` ON `Image` (`aiEngine`);--> statement-breakpoint
CREATE INDEX `Image_aiOriginDetected_idx` ON `Image` (`aiOriginDetected`);--> statement-breakpoint
CREATE TABLE `__new_JsonFile` (
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
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`folderId`) REFERENCES `Folder`(`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "JsonFile_size_check" CHECK(size >= 0 AND size <= 107374182400),
	CONSTRAINT "JsonFile_hash_format_check" CHECK(length(hash) = 64),
	CONSTRAINT "JsonFile_path_length_check" CHECK(length(path) BETWEEN 1 AND 1000),
	CONSTRAINT "JsonFile_shape_check" CHECK((fileSize IS NULL OR fileSize >= 0) AND (keyCount IS NULL OR keyCount >= 0) AND (depth IS NULL OR depth >= 0))
);
--> statement-breakpoint
INSERT INTO `__new_JsonFile`("id", "name", "path", "size", "hash", "mimeType", "extension", "folderId", "isFavorite", "isArchived", "content", "schema", "isValid", "validationErrors", "keyCount", "depth", "description", "emoji", "color", "shortcut", "category", "filePath", "fileName", "fileSize", "tags", "metadata", "sortBy", "filters", "featuredImage", "validJson", "schemaVersion", "keys", "values", "hasArrays", "hasObjects", "encoding", "compressed", "minified", "prettyPrinted", "parsedContent", "createdAt", "updatedAt") SELECT "id", "name", "path", "size", "hash", "mimeType", "extension", "folderId", "isFavorite", "isArchived", "content", "schema", "isValid", "validationErrors", "keyCount", "depth", "description", "emoji", "color", "shortcut", "category", "filePath", "fileName", "fileSize", "tags", "metadata", "sortBy", "filters", "featuredImage", "validJson", "schemaVersion", "keys", "values", "hasArrays", "hasObjects", "encoding", "compressed", "minified", "prettyPrinted", "parsedContent", "createdAt", "updatedAt" FROM `JsonFile`;--> statement-breakpoint
DROP TABLE `JsonFile`;--> statement-breakpoint
ALTER TABLE `__new_JsonFile` RENAME TO `JsonFile`;--> statement-breakpoint
CREATE UNIQUE INDEX `JsonFile_path_key` ON `JsonFile` (`path`);--> statement-breakpoint
CREATE INDEX `JsonFile_folderId_idx` ON `JsonFile` (`folderId`);--> statement-breakpoint
CREATE INDEX `JsonFile_hash_idx` ON `JsonFile` (`hash`);--> statement-breakpoint
CREATE INDEX `JsonFile_folderId_hash_idx` ON `JsonFile` (`folderId`,`hash`);--> statement-breakpoint
CREATE INDEX `JsonFile_createdAt_idx` ON `JsonFile` (`createdAt`);--> statement-breakpoint
CREATE INDEX `JsonFile_updatedAt_idx` ON `JsonFile` (`updatedAt`);--> statement-breakpoint
CREATE TABLE `__new_Metadata` (
	`id` text PRIMARY KEY NOT NULL,
	`entityType` text NOT NULL,
	`entityId` text NOT NULL,
	`key` text NOT NULL,
	`value` text,
	`type` text DEFAULT 'string',
	`category` text,
	`description` text,
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer
);
--> statement-breakpoint
INSERT INTO `__new_Metadata`("id", "entityType", "entityId", "key", "value", "type", "category", "description", "createdAt", "updatedAt") SELECT "id", "entityType", "entityId", "key", "value", "type", "category", "description", CASE WHEN typeof("createdAt") = 'text' THEN CAST(strftime('%s', "createdAt") AS INTEGER) * 1000 + CAST(substr(strftime('%f', "createdAt"), 4, 3) AS INTEGER) WHEN abs(CAST("createdAt" AS REAL)) < 100000000000 THEN CAST(CAST("createdAt" AS REAL) * 1000 AS INTEGER) ELSE CAST("createdAt" AS INTEGER) END, "updatedAt" FROM `Metadata`;--> statement-breakpoint
DROP TABLE `Metadata`;--> statement-breakpoint
ALTER TABLE `__new_Metadata` RENAME TO `Metadata`;--> statement-breakpoint
CREATE INDEX `Metadata_entityType_entityId_idx` ON `Metadata` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `Metadata_key_idx` ON `Metadata` (`key`);--> statement-breakpoint
CREATE TABLE `__new_Note` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`category` text DEFAULT 'general' NOT NULL,
	`featuredImage` text,
	`isFavorite` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer
);
--> statement-breakpoint
INSERT INTO `__new_Note`("id", "title", "content", "category", "featuredImage", "isFavorite", "createdAt", "updatedAt") SELECT "id", "title", "content", "category", "featuredImage", "isFavorite", "createdAt", "updatedAt" FROM `Note`;--> statement-breakpoint
DROP TABLE `Note`;--> statement-breakpoint
ALTER TABLE `__new_Note` RENAME TO `Note`;--> statement-breakpoint
CREATE UNIQUE INDEX `Note_title_key` ON `Note` (`title`);--> statement-breakpoint
CREATE TABLE `__new_Place` (
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
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`parentId`) REFERENCES `Place`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_Place`("id", "name", "description", "emoji", "color", "category", "filters", "isFavorite", "metadata", "type", "location", "climate", "population", "government", "economy", "culture", "history", "geography", "landmarks", "dangers", "resources", "notes", "featuredImage", "parentId", "createdAt", "updatedAt") SELECT "id", "name", "description", "emoji", "color", "category", "filters", "isFavorite", "metadata", "type", "location", "climate", "population", "government", "economy", "culture", "history", "geography", "landmarks", "dangers", "resources", "notes", "featuredImage", "parentId", "createdAt", "updatedAt" FROM `Place`;--> statement-breakpoint
DROP TABLE `Place`;--> statement-breakpoint
ALTER TABLE `__new_Place` RENAME TO `Place`;--> statement-breakpoint
CREATE UNIQUE INDEX `Place_name_key` ON `Place` (`name`);--> statement-breakpoint
CREATE INDEX `Place_parentId_idx` ON `Place` (`parentId`);--> statement-breakpoint
CREATE TABLE `__new_Profile` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`emoji` text DEFAULT '👤' NOT NULL,
	`color` text DEFAULT '#3b82f6' NOT NULL,
	`description` text,
	`isActive` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	`settingsId` text,
	`imageId` text,
	FOREIGN KEY (`imageId`) REFERENCES `UploadedImage`(`id`) ON UPDATE cascade ON DELETE set null,
	CONSTRAINT "Profile_color_format_check" CHECK(color LIKE '#%' AND length(color) = 7)
);
--> statement-breakpoint
INSERT INTO `__new_Profile`("id", "name", "emoji", "color", "description", "isActive", "createdAt", "updatedAt", "settingsId", "imageId") SELECT "id", "name", "emoji", "color", "description", "isActive", CASE WHEN typeof("createdAt") = 'text' THEN CAST(strftime('%s', "createdAt") AS INTEGER) * 1000 + CAST(substr(strftime('%f', "createdAt"), 4, 3) AS INTEGER) WHEN abs(CAST("createdAt" AS REAL)) < 100000000000 THEN CAST(CAST("createdAt" AS REAL) * 1000 AS INTEGER) ELSE CAST("createdAt" AS INTEGER) END, "updatedAt", "settingsId", "imageId" FROM `Profile`;--> statement-breakpoint
DROP TABLE `Profile`;--> statement-breakpoint
ALTER TABLE `__new_Profile` RENAME TO `Profile`;--> statement-breakpoint
CREATE TABLE `__new_Prompt` (
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
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`parentId`) REFERENCES `Prompt`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_Prompt`("id", "name", "description", "content", "emoji", "color", "category", "filters", "isFavorite", "metadata", "type", "notes", "featuredImage", "parentId", "createdAt", "updatedAt") SELECT "id", "name", "description", "content", "emoji", "color", "category", "filters", "isFavorite", "metadata", "type", "notes", "featuredImage", "parentId", "createdAt", "updatedAt" FROM `Prompt`;--> statement-breakpoint
DROP TABLE `Prompt`;--> statement-breakpoint
ALTER TABLE `__new_Prompt` RENAME TO `Prompt`;--> statement-breakpoint
CREATE UNIQUE INDEX `Prompt_name_key` ON `Prompt` (`name`);--> statement-breakpoint
CREATE INDEX `Prompt_parentId_idx` ON `Prompt` (`parentId`);--> statement-breakpoint
CREATE TABLE `__new_Property` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`emoji` text DEFAULT '🔍',
	`color` text DEFAULT '#f97316',
	`category` text,
	`featuredImage` text,
	`isFavorite` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer
);
--> statement-breakpoint
INSERT INTO `__new_Property`("id", "name", "description", "emoji", "color", "category", "featuredImage", "isFavorite", "createdAt", "updatedAt") SELECT "id", "name", "description", "emoji", "color", "category", "featuredImage", "isFavorite", "createdAt", "updatedAt" FROM `Property`;--> statement-breakpoint
DROP TABLE `Property`;--> statement-breakpoint
ALTER TABLE `__new_Property` RENAME TO `Property`;--> statement-breakpoint
CREATE UNIQUE INDEX `Property_name_key` ON `Property` (`name`);--> statement-breakpoint
CREATE TABLE `__new_QueueJob` (
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
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	`priority` integer DEFAULT 0 NOT NULL,
	`metadata` text,
	`retryAt` integer,
	CONSTRAINT "QueueJob_status_check" CHECK(status IN ('pending', 'processing', 'completed', 'failed', 'retrying', 'cancelled', 'paused')),
	CONSTRAINT "QueueJob_attempts_check" CHECK(attempts >= 0 AND maxAttempts > 0 AND attempts <= maxAttempts),
	CONSTRAINT "QueueJob_progress_check" CHECK(progress BETWEEN 0 AND 100)
);
--> statement-breakpoint
INSERT INTO `__new_QueueJob`("id", "queue", "data", "status", "attempts", "maxAttempts", "error", "progress", "startedAt", "finishedAt", "createdAt", "updatedAt", "priority", "metadata", "retryAt") SELECT "id", "queue", "data", "status", "attempts", "maxAttempts", "error", "progress", "startedAt", "finishedAt", "createdAt", "updatedAt", "priority", "metadata", "retryAt" FROM `QueueJob`;--> statement-breakpoint
DROP TABLE `QueueJob`;--> statement-breakpoint
ALTER TABLE `__new_QueueJob` RENAME TO `QueueJob`;--> statement-breakpoint
CREATE INDEX `QueueJob_queue_status_idx` ON `QueueJob` (`queue`,`status`);--> statement-breakpoint
CREATE INDEX `QueueJob_status_createdAt_idx` ON `QueueJob` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `QueueJob_priority_status_createdAt_idx` ON `QueueJob` (`priority`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `QueueJob_retryAt_idx` ON `QueueJob` (`retryAt`);--> statement-breakpoint
CREATE TABLE `__new_Tag` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`emoji` text DEFAULT '🏷️',
	`color` text DEFAULT '#22c55e',
	`category` text,
	`featuredImage` text,
	`isFavorite` integer DEFAULT false NOT NULL,
	`parentId` text,
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`parentId`) REFERENCES `Tag`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_Tag`("id", "name", "description", "emoji", "color", "category", "featuredImage", "isFavorite", "parentId", "createdAt", "updatedAt") SELECT "id", "name", "description", "emoji", "color", "category", "featuredImage", "isFavorite", "parentId", "createdAt", "updatedAt" FROM `Tag`;--> statement-breakpoint
DROP TABLE `Tag`;--> statement-breakpoint
ALTER TABLE `__new_Tag` RENAME TO `Tag`;--> statement-breakpoint
CREATE UNIQUE INDEX `Tag_name_key` ON `Tag` (`name`);--> statement-breakpoint
CREATE INDEX `Tag_parentId_idx` ON `Tag` (`parentId`);--> statement-breakpoint
CREATE TABLE `__new_Thumbnail` (
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
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer
);
--> statement-breakpoint
INSERT INTO `__new_Thumbnail`("id", "entityType", "entityId", "size", "path", "width", "height", "format", "quality", "fileSize", "isGenerated", "createdAt", "updatedAt") SELECT "id", "entityType", "entityId", "size", "path", "width", "height", "format", "quality", "fileSize", "isGenerated", "createdAt", "updatedAt" FROM `Thumbnail`;--> statement-breakpoint
DROP TABLE `Thumbnail`;--> statement-breakpoint
ALTER TABLE `__new_Thumbnail` RENAME TO `Thumbnail`;--> statement-breakpoint
CREATE UNIQUE INDEX `Thumbnail_entityType_entityId_size_key` ON `Thumbnail` (`entityType`,`entityId`,`size`);--> statement-breakpoint
CREATE UNIQUE INDEX `Thumbnail_path_key` ON `Thumbnail` (`path`);--> statement-breakpoint
CREATE TABLE `__new_UploadedImage` (
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
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`imageId`) REFERENCES `Image`(`id`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "UploadedImage_size_check" CHECK(size >= 0 AND size <= 107374182400),
	CONSTRAINT "UploadedImage_hash_format_check" CHECK(length(hash) = 64),
	CONSTRAINT "UploadedImage_path_length_check" CHECK(length(path) BETWEEN 1 AND 1000),
	CONSTRAINT "UploadedImage_dimensions_check" CHECK((width IS NULL OR width > 0) AND (height IS NULL OR height > 0))
);
--> statement-breakpoint
INSERT INTO `__new_UploadedImage`("id", "name", "path", "size", "hash", "metadata", "imageId", "type", "category", "width", "height", "createdAt", "updatedAt") SELECT "id", "name", "path", "size", "hash", "metadata", "imageId", "type", "category", "width", "height", "createdAt", "updatedAt" FROM `UploadedImage`;--> statement-breakpoint
DROP TABLE `UploadedImage`;--> statement-breakpoint
ALTER TABLE `__new_UploadedImage` RENAME TO `UploadedImage`;--> statement-breakpoint
CREATE UNIQUE INDEX `UploadedImage_path_key` ON `UploadedImage` (`path`);--> statement-breakpoint
CREATE INDEX `UploadedImage_imageId_idx` ON `UploadedImage` (`imageId`);--> statement-breakpoint
CREATE INDEX `UploadedImage_hash_idx` ON `UploadedImage` (`hash`);--> statement-breakpoint
CREATE INDEX `UploadedImage_type_idx` ON `UploadedImage` (`type`);--> statement-breakpoint
CREATE INDEX `UploadedImage_category_idx` ON `UploadedImage` (`category`);--> statement-breakpoint
CREATE TABLE `__new_Video` (
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
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`folderId`) REFERENCES `Folder`(`id`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "Video_size_check" CHECK(size >= 0 AND size <= 107374182400),
	CONSTRAINT "Video_duration_check" CHECK(duration >= 0 AND duration <= 86400),
	CONSTRAINT "Video_hash_format_check" CHECK(length(hash) = 64),
	CONSTRAINT "Video_path_length_check" CHECK(length(path) BETWEEN 1 AND 1000)
);
--> statement-breakpoint
INSERT INTO `__new_Video`("id", "name", "description", "path", "hash", "size", "duration", "width", "height", "metadata", "thumbnail", "thumbnailSize", "thumbnailWidth", "thumbnailHeight", "isFavorite", "isHidden", "folderId", "createdAt", "updatedAt") SELECT "id", "name", "description", "path", "hash", "size", "duration", "width", "height", "metadata", "thumbnail", "thumbnailSize", "thumbnailWidth", "thumbnailHeight", "isFavorite", "isHidden", "folderId", "createdAt", "updatedAt" FROM `Video`;--> statement-breakpoint
DROP TABLE `Video`;--> statement-breakpoint
ALTER TABLE `__new_Video` RENAME TO `Video`;--> statement-breakpoint
CREATE UNIQUE INDEX `Video_path_key` ON `Video` (`path`);--> statement-breakpoint
CREATE INDEX `Video_folderId_idx` ON `Video` (`folderId`);--> statement-breakpoint
CREATE INDEX `Video_hash_idx` ON `Video` (`hash`);--> statement-breakpoint
CREATE INDEX `Video_folderId_hash_idx` ON `Video` (`folderId`,`hash`);--> statement-breakpoint
CREATE INDEX `Video_createdAt_idx` ON `Video` (`createdAt`);--> statement-breakpoint
CREATE INDEX `Video_updatedAt_idx` ON `Video` (`updatedAt`);--> statement-breakpoint
CREATE TABLE `__new_Wildcard` (
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
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`parentId`) REFERENCES `Wildcard`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_Wildcard`("id", "name", "description", "emoji", "color", "category", "children", "featuredImage", "isFavorite", "parentId", "createdAt", "updatedAt") SELECT "id", "name", "description", "emoji", "color", "category", "children", "featuredImage", "isFavorite", "parentId", "createdAt", "updatedAt" FROM `Wildcard`;--> statement-breakpoint
DROP TABLE `Wildcard`;--> statement-breakpoint
ALTER TABLE `__new_Wildcard` RENAME TO `Wildcard`;--> statement-breakpoint
CREATE UNIQUE INDEX `Wildcard_name_key` ON `Wildcard` (`name`);--> statement-breakpoint
CREATE INDEX `Wildcard_parentId_idx` ON `Wildcard` (`parentId`);--> statement-breakpoint
CREATE TABLE `__new_WorldItem` (
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
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer,
	FOREIGN KEY (`parentId`) REFERENCES `WorldItem`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_WorldItem`("id", "name", "description", "emoji", "color", "category", "subtype", "isFavorite", "isArchived", "type", "rarity", "value", "weight", "size", "material", "materials", "crafting", "requirements", "effects", "origin", "properties", "uses", "history", "notes", "lore", "sortBy", "filters", "featuredImage", "parentId", "createdAt", "updatedAt") SELECT "id", "name", "description", "emoji", "color", "category", "subtype", "isFavorite", "isArchived", "type", "rarity", "value", "weight", "size", "material", "materials", "crafting", "requirements", "effects", "origin", "properties", "uses", "history", "notes", "lore", "sortBy", "filters", "featuredImage", "parentId", "createdAt", "updatedAt" FROM `WorldItem`;--> statement-breakpoint
DROP TABLE `WorldItem`;--> statement-breakpoint
ALTER TABLE `__new_WorldItem` RENAME TO `WorldItem`;--> statement-breakpoint
CREATE UNIQUE INDEX `WorldItem_name_key` ON `WorldItem` (`name`);--> statement-breakpoint
CREATE INDEX `WorldItem_parentId_idx` ON `WorldItem` (`parentId`);--> statement-breakpoint
CREATE TABLE `__new__GroupToAlbum` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Group`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `Album`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new__GroupToAlbum`("A", "B") SELECT "A", "B" FROM `_GroupToAlbum`;--> statement-breakpoint
DROP TABLE `_GroupToAlbum`;--> statement-breakpoint
ALTER TABLE `__new__GroupToAlbum` RENAME TO `_GroupToAlbum`;--> statement-breakpoint
CREATE UNIQUE INDEX `_GroupToAlbum_AB_unique` ON `_GroupToAlbum` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_GroupToAlbum_B_index` ON `_GroupToAlbum` (`B`);--> statement-breakpoint
CREATE TABLE `__new__GroupToImage` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Group`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `Image`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new__GroupToImage`("A", "B") SELECT "A", "B" FROM `_GroupToImage`;--> statement-breakpoint
DROP TABLE `_GroupToImage`;--> statement-breakpoint
ALTER TABLE `__new__GroupToImage` RENAME TO `_GroupToImage`;--> statement-breakpoint
CREATE UNIQUE INDEX `_GroupToImage_AB_unique` ON `_GroupToImage` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_GroupToImage_B_index` ON `_GroupToImage` (`B`);--> statement-breakpoint
CREATE TABLE `__new__GroupToTag` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Group`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `Tag`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new__GroupToTag`("A", "B") SELECT "A", "B" FROM `_GroupToTag`;--> statement-breakpoint
DROP TABLE `_GroupToTag`;--> statement-breakpoint
ALTER TABLE `__new__GroupToTag` RENAME TO `_GroupToTag`;--> statement-breakpoint
CREATE UNIQUE INDEX `_GroupToTag_AB_unique` ON `_GroupToTag` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_GroupToTag_B_index` ON `_GroupToTag` (`B`);--> statement-breakpoint
CREATE TABLE `__new__GroupToVideo` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Group`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `Video`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new__GroupToVideo`("A", "B") SELECT "A", "B" FROM `_GroupToVideo`;--> statement-breakpoint
DROP TABLE `_GroupToVideo`;--> statement-breakpoint
ALTER TABLE `__new__GroupToVideo` RENAME TO `_GroupToVideo`;--> statement-breakpoint
CREATE UNIQUE INDEX `_GroupToVideo_AB_unique` ON `_GroupToVideo` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_GroupToVideo_B_index` ON `_GroupToVideo` (`B`);--> statement-breakpoint
CREATE TABLE `__new__ImageToAlbum` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Image`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `Album`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new__ImageToAlbum`("A", "B") SELECT "A", "B" FROM `_ImageToAlbum`;--> statement-breakpoint
DROP TABLE `_ImageToAlbum`;--> statement-breakpoint
ALTER TABLE `__new__ImageToAlbum` RENAME TO `_ImageToAlbum`;--> statement-breakpoint
CREATE UNIQUE INDEX `_ImageToAlbum_AB_unique` ON `_ImageToAlbum` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_ImageToAlbum_B_index` ON `_ImageToAlbum` (`B`);--> statement-breakpoint
CREATE TABLE `__new__ImageToCharacter` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Image`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `Character`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new__ImageToCharacter`("A", "B") SELECT "A", "B" FROM `_ImageToCharacter`;--> statement-breakpoint
DROP TABLE `_ImageToCharacter`;--> statement-breakpoint
ALTER TABLE `__new__ImageToCharacter` RENAME TO `_ImageToCharacter`;--> statement-breakpoint
CREATE UNIQUE INDEX `_ImageToCharacter_AB_unique` ON `_ImageToCharacter` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_ImageToCharacter_B_index` ON `_ImageToCharacter` (`B`);--> statement-breakpoint
CREATE TABLE `__new__ImageToCollection` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Image`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `Collection`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new__ImageToCollection`("A", "B") SELECT "A", "B" FROM `_ImageToCollection`;--> statement-breakpoint
DROP TABLE `_ImageToCollection`;--> statement-breakpoint
ALTER TABLE `__new__ImageToCollection` RENAME TO `_ImageToCollection`;--> statement-breakpoint
CREATE UNIQUE INDEX `_ImageToCollection_AB_unique` ON `_ImageToCollection` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_ImageToCollection_B_index` ON `_ImageToCollection` (`B`);--> statement-breakpoint
CREATE TABLE `__new__ImageToConcept` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Image`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `Concept`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new__ImageToConcept`("A", "B") SELECT "A", "B" FROM `_ImageToConcept`;--> statement-breakpoint
DROP TABLE `_ImageToConcept`;--> statement-breakpoint
ALTER TABLE `__new__ImageToConcept` RENAME TO `_ImageToConcept`;--> statement-breakpoint
CREATE UNIQUE INDEX `_ImageToConcept_AB_unique` ON `_ImageToConcept` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_ImageToConcept_B_index` ON `_ImageToConcept` (`B`);--> statement-breakpoint
CREATE TABLE `__new__ImageToNote` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Image`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `Note`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new__ImageToNote`("A", "B") SELECT "A", "B" FROM `_ImageToNote`;--> statement-breakpoint
DROP TABLE `_ImageToNote`;--> statement-breakpoint
ALTER TABLE `__new__ImageToNote` RENAME TO `_ImageToNote`;--> statement-breakpoint
CREATE UNIQUE INDEX `_ImageToNote_AB_unique` ON `_ImageToNote` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_ImageToNote_B_index` ON `_ImageToNote` (`B`);--> statement-breakpoint
CREATE TABLE `__new__ImageToPlace` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Image`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `Place`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new__ImageToPlace`("A", "B") SELECT "A", "B" FROM `_ImageToPlace`;--> statement-breakpoint
DROP TABLE `_ImageToPlace`;--> statement-breakpoint
ALTER TABLE `__new__ImageToPlace` RENAME TO `_ImageToPlace`;--> statement-breakpoint
CREATE UNIQUE INDEX `_ImageToPlace_AB_unique` ON `_ImageToPlace` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_ImageToPlace_B_index` ON `_ImageToPlace` (`B`);--> statement-breakpoint
CREATE TABLE `__new__ImageToPrompt` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Image`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `Prompt`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new__ImageToPrompt`("A", "B") SELECT "A", "B" FROM `_ImageToPrompt`;--> statement-breakpoint
DROP TABLE `_ImageToPrompt`;--> statement-breakpoint
ALTER TABLE `__new__ImageToPrompt` RENAME TO `_ImageToPrompt`;--> statement-breakpoint
CREATE UNIQUE INDEX `_ImageToPrompt_AB_unique` ON `_ImageToPrompt` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_ImageToPrompt_B_index` ON `_ImageToPrompt` (`B`);--> statement-breakpoint
CREATE TABLE `__new__ImageToProperty` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Image`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `Property`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new__ImageToProperty`("A", "B") SELECT "A", "B" FROM `_ImageToProperty`;--> statement-breakpoint
DROP TABLE `_ImageToProperty`;--> statement-breakpoint
ALTER TABLE `__new__ImageToProperty` RENAME TO `_ImageToProperty`;--> statement-breakpoint
CREATE UNIQUE INDEX `_ImageToProperty_AB_unique` ON `_ImageToProperty` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_ImageToProperty_B_index` ON `_ImageToProperty` (`B`);--> statement-breakpoint
CREATE TABLE `__new__ImageToTag` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Image`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `Tag`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new__ImageToTag`("A", "B") SELECT "A", "B" FROM `_ImageToTag`;--> statement-breakpoint
DROP TABLE `_ImageToTag`;--> statement-breakpoint
ALTER TABLE `__new__ImageToTag` RENAME TO `_ImageToTag`;--> statement-breakpoint
CREATE UNIQUE INDEX `_ImageToTag_AB_unique` ON `_ImageToTag` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_ImageToTag_B_index` ON `_ImageToTag` (`B`);--> statement-breakpoint
CREATE TABLE `__new__ImageToWildcard` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Image`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `Wildcard`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new__ImageToWildcard`("A", "B") SELECT "A", "B" FROM `_ImageToWildcard`;--> statement-breakpoint
DROP TABLE `_ImageToWildcard`;--> statement-breakpoint
ALTER TABLE `__new__ImageToWildcard` RENAME TO `_ImageToWildcard`;--> statement-breakpoint
CREATE UNIQUE INDEX `_ImageToWildcard_AB_unique` ON `_ImageToWildcard` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_ImageToWildcard_B_index` ON `_ImageToWildcard` (`B`);--> statement-breakpoint
CREATE TABLE `__new__ImageToWorldItem` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Image`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `WorldItem`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new__ImageToWorldItem`("A", "B") SELECT "A", "B" FROM `_ImageToWorldItem`;--> statement-breakpoint
DROP TABLE `_ImageToWorldItem`;--> statement-breakpoint
ALTER TABLE `__new__ImageToWorldItem` RENAME TO `_ImageToWorldItem`;--> statement-breakpoint
CREATE UNIQUE INDEX `_ImageToWorldItem_AB_unique` ON `_ImageToWorldItem` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_ImageToWorldItem_B_index` ON `_ImageToWorldItem` (`B`);--> statement-breakpoint
CREATE TABLE `__new_Settings` (
	`id` text PRIMARY KEY NOT NULL,
	`theme` text DEFAULT 'system' NOT NULL,
	`language` text DEFAULT 'es' NOT NULL,
	`data` text NOT NULL,
	`profileId` text NOT NULL,
	FOREIGN KEY (`profileId`) REFERENCES `Profile`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_Settings`("id", "theme", "language", "data", "profileId") SELECT "id", "theme", "language", "data", "profileId" FROM `Settings`;--> statement-breakpoint
DROP TABLE `Settings`;--> statement-breakpoint
ALTER TABLE `__new_Settings` RENAME TO `Settings`;--> statement-breakpoint
CREATE UNIQUE INDEX `Settings_profileId_key` ON `Settings` (`profileId`);--> statement-breakpoint
CREATE TABLE `__new__VideoToAlbum` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Video`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `Album`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new__VideoToAlbum`("A", "B") SELECT "A", "B" FROM `_VideoToAlbum`;--> statement-breakpoint
DROP TABLE `_VideoToAlbum`;--> statement-breakpoint
ALTER TABLE `__new__VideoToAlbum` RENAME TO `_VideoToAlbum`;--> statement-breakpoint
CREATE UNIQUE INDEX `_VideoToAlbum_AB_unique` ON `_VideoToAlbum` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_VideoToAlbum_B_index` ON `_VideoToAlbum` (`B`);--> statement-breakpoint
CREATE TABLE `__new__VideoToCharacter` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Video`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `Character`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new__VideoToCharacter`("A", "B") SELECT "A", "B" FROM `_VideoToCharacter`;--> statement-breakpoint
DROP TABLE `_VideoToCharacter`;--> statement-breakpoint
ALTER TABLE `__new__VideoToCharacter` RENAME TO `_VideoToCharacter`;--> statement-breakpoint
CREATE UNIQUE INDEX `_VideoToCharacter_AB_unique` ON `_VideoToCharacter` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_VideoToCharacter_B_index` ON `_VideoToCharacter` (`B`);--> statement-breakpoint
CREATE TABLE `__new__VideoToCollection` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Video`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `Collection`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new__VideoToCollection`("A", "B") SELECT "A", "B" FROM `_VideoToCollection`;--> statement-breakpoint
DROP TABLE `_VideoToCollection`;--> statement-breakpoint
ALTER TABLE `__new__VideoToCollection` RENAME TO `_VideoToCollection`;--> statement-breakpoint
CREATE UNIQUE INDEX `_VideoToCollection_AB_unique` ON `_VideoToCollection` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_VideoToCollection_B_index` ON `_VideoToCollection` (`B`);--> statement-breakpoint
CREATE TABLE `__new__VideoToConcept` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Video`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `Concept`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new__VideoToConcept`("A", "B") SELECT "A", "B" FROM `_VideoToConcept`;--> statement-breakpoint
DROP TABLE `_VideoToConcept`;--> statement-breakpoint
ALTER TABLE `__new__VideoToConcept` RENAME TO `_VideoToConcept`;--> statement-breakpoint
CREATE UNIQUE INDEX `_VideoToConcept_AB_unique` ON `_VideoToConcept` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_VideoToConcept_B_index` ON `_VideoToConcept` (`B`);--> statement-breakpoint
CREATE TABLE `__new__VideoToNote` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Video`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `Note`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new__VideoToNote`("A", "B") SELECT "A", "B" FROM `_VideoToNote`;--> statement-breakpoint
DROP TABLE `_VideoToNote`;--> statement-breakpoint
ALTER TABLE `__new__VideoToNote` RENAME TO `_VideoToNote`;--> statement-breakpoint
CREATE UNIQUE INDEX `_VideoToNote_AB_unique` ON `_VideoToNote` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_VideoToNote_B_index` ON `_VideoToNote` (`B`);--> statement-breakpoint
CREATE TABLE `__new__VideoToPlace` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Video`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `Place`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new__VideoToPlace`("A", "B") SELECT "A", "B" FROM `_VideoToPlace`;--> statement-breakpoint
DROP TABLE `_VideoToPlace`;--> statement-breakpoint
ALTER TABLE `__new__VideoToPlace` RENAME TO `_VideoToPlace`;--> statement-breakpoint
CREATE UNIQUE INDEX `_VideoToPlace_AB_unique` ON `_VideoToPlace` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_VideoToPlace_B_index` ON `_VideoToPlace` (`B`);--> statement-breakpoint
CREATE TABLE `__new__VideoToPrompt` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Video`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `Prompt`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new__VideoToPrompt`("A", "B") SELECT "A", "B" FROM `_VideoToPrompt`;--> statement-breakpoint
DROP TABLE `_VideoToPrompt`;--> statement-breakpoint
ALTER TABLE `__new__VideoToPrompt` RENAME TO `_VideoToPrompt`;--> statement-breakpoint
CREATE UNIQUE INDEX `_VideoToPrompt_AB_unique` ON `_VideoToPrompt` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_VideoToPrompt_B_index` ON `_VideoToPrompt` (`B`);--> statement-breakpoint
CREATE TABLE `__new__VideoToProperty` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Video`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `Property`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new__VideoToProperty`("A", "B") SELECT "A", "B" FROM `_VideoToProperty`;--> statement-breakpoint
DROP TABLE `_VideoToProperty`;--> statement-breakpoint
ALTER TABLE `__new__VideoToProperty` RENAME TO `_VideoToProperty`;--> statement-breakpoint
CREATE UNIQUE INDEX `_VideoToProperty_AB_unique` ON `_VideoToProperty` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_VideoToProperty_B_index` ON `_VideoToProperty` (`B`);--> statement-breakpoint
CREATE TABLE `__new__VideoToTag` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Video`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `Tag`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new__VideoToTag`("A", "B") SELECT "A", "B" FROM `_VideoToTag`;--> statement-breakpoint
DROP TABLE `_VideoToTag`;--> statement-breakpoint
ALTER TABLE `__new__VideoToTag` RENAME TO `_VideoToTag`;--> statement-breakpoint
CREATE UNIQUE INDEX `_VideoToTag_AB_unique` ON `_VideoToTag` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_VideoToTag_B_index` ON `_VideoToTag` (`B`);--> statement-breakpoint
CREATE TABLE `__new__VideoToWildcard` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Video`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `Wildcard`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new__VideoToWildcard`("A", "B") SELECT "A", "B" FROM `_VideoToWildcard`;--> statement-breakpoint
DROP TABLE `_VideoToWildcard`;--> statement-breakpoint
ALTER TABLE `__new__VideoToWildcard` RENAME TO `_VideoToWildcard`;--> statement-breakpoint
CREATE UNIQUE INDEX `_VideoToWildcard_AB_unique` ON `_VideoToWildcard` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_VideoToWildcard_B_index` ON `_VideoToWildcard` (`B`);--> statement-breakpoint
CREATE TABLE `__new__VideoToWorldItem` (
	`A` text NOT NULL,
	`B` text NOT NULL,
	FOREIGN KEY (`A`) REFERENCES `Video`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`B`) REFERENCES `WorldItem`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new__VideoToWorldItem`("A", "B") SELECT "A", "B" FROM `_VideoToWorldItem`;--> statement-breakpoint
DROP TABLE `_VideoToWorldItem`;--> statement-breakpoint
ALTER TABLE `__new__VideoToWorldItem` RENAME TO `_VideoToWorldItem`;--> statement-breakpoint
CREATE UNIQUE INDEX `_VideoToWorldItem_AB_unique` ON `_VideoToWorldItem` (`A`,`B`);--> statement-breakpoint
CREATE INDEX `_VideoToWorldItem_B_index` ON `_VideoToWorldItem` (`B`);
