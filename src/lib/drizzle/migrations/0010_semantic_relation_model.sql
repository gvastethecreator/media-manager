PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_TaxonomyArtifact` (
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
	`authoredMetadata` text DEFAULT '{}' NOT NULL,
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
				AND typeof(updatedAt) = 'integer' AND typeof(authoredMetadata) = 'text'),
	CONSTRAINT "TaxonomyArtifact_authored_metadata_check" CHECK(json_valid(authoredMetadata) AND json_type(authoredMetadata) = 'object'),
	CONSTRAINT "TaxonomyArtifact_timestamps_check" CHECK(lastSyncedAt >= 0 AND createdAt >= 0 AND updatedAt >= createdAt)
);
--> statement-breakpoint
INSERT INTO `__new_TaxonomyArtifact` (
	`entityType`, `entityId`, `rootId`, `relativePath`, `contentHash`, `byteSize`, `syncStatus`,
	`indexedTitle`, `indexedSummary`, `indexedBody`, `lastSyncedAt`, `createdAt`, `updatedAt`, `authoredMetadata`
)
SELECT
	`entityType`, `entityId`, `rootId`, `relativePath`, `contentHash`, `byteSize`, `syncStatus`,
	`indexedTitle`, `indexedSummary`, `indexedBody`, `lastSyncedAt`, `createdAt`, `updatedAt`, '{}'
FROM `TaxonomyArtifact`;--> statement-breakpoint
DROP TABLE `TaxonomyArtifact`;--> statement-breakpoint
ALTER TABLE `__new_TaxonomyArtifact` RENAME TO `TaxonomyArtifact`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `TaxonomyArtifact_rootId_relativePath_key` ON `TaxonomyArtifact` (`rootId`,"relativePath" COLLATE NOCASE);--> statement-breakpoint
CREATE INDEX `TaxonomyArtifact_rootId_idx` ON `TaxonomyArtifact` (`rootId`);--> statement-breakpoint
CREATE INDEX `TaxonomyArtifact_syncStatus_idx` ON `TaxonomyArtifact` (`syncStatus`);--> statement-breakpoint
CREATE INDEX `TaxonomyArtifact_entityType_title_idx` ON `TaxonomyArtifact` (`entityType`,`indexedTitle`);--> statement-breakpoint
CREATE TABLE `TaxonomyArtifactMutationPermit` (
	`entityType` text NOT NULL,
	`entityId` text NOT NULL,
	`operation` text NOT NULL,
	PRIMARY KEY(`entityType`, `entityId`, `operation`),
	CONSTRAINT "TaxonomyArtifactMutationPermit_entity_type_check" CHECK(entityType IN ('prompt', 'note', 'wildcard')),
	CONSTRAINT "TaxonomyArtifactMutationPermit_operation_check" CHECK(operation IN ('update', 'delete'))
);--> statement-breakpoint
CREATE TABLE `RelationRoleApplicability` (
	`roleSlug` text NOT NULL,
	`sourceFamily` text NOT NULL,
	`targetFamily` text NOT NULL,
	PRIMARY KEY(`roleSlug`, `sourceFamily`, `targetFamily`),
	FOREIGN KEY (`roleSlug`) REFERENCES `RelationRole`(`slug`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "RelationRoleApplicability_family_check" CHECK(sourceFamily IN ('asset', 'organizer', 'narrative_entity', 'prompt', 'note', 'wildcard')
				AND targetFamily IN ('asset', 'organizer', 'narrative_entity', 'prompt', 'note', 'wildcard'))
);
--> statement-breakpoint
CREATE INDEX `RelationRoleApplicability_target_idx` ON `RelationRoleApplicability` (`targetFamily`,`sourceFamily`,`roleSlug`);--> statement-breakpoint
CREATE TABLE `RelationRoleConflict` (
	`leftRoleSlug` text NOT NULL,
	`rightRoleSlug` text NOT NULL,
	PRIMARY KEY(`leftRoleSlug`, `rightRoleSlug`),
	FOREIGN KEY (`leftRoleSlug`) REFERENCES `RelationRole`(`slug`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`rightRoleSlug`) REFERENCES `RelationRole`(`slug`) ON UPDATE cascade ON DELETE cascade,
	CONSTRAINT "RelationRoleConflict_canonical_order_check" CHECK(leftRoleSlug < rightRoleSlug)
);
--> statement-breakpoint
CREATE TABLE `RelationRole` (
	`slug` text PRIMARY KEY NOT NULL,
	`forwardLabel` text NOT NULL,
	`inverseLabel` text NOT NULL,
	`isSymmetric` integer DEFAULT false NOT NULL,
	`allowSelf` integer DEFAULT false NOT NULL,
	`deprecatedAt` integer,
	`replacementSlug` text,
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	FOREIGN KEY (`replacementSlug`) REFERENCES `RelationRole`(`slug`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "RelationRole_slug_check" CHECK(length(slug) BETWEEN 1 AND 64 AND slug = lower(slug)
				AND substr(slug, 1, 1) GLOB '[a-z]' AND slug NOT GLOB '*[^a-z0-9_]*'),
	CONSTRAINT "RelationRole_labels_check" CHECK(length(trim(forwardLabel)) BETWEEN 1 AND 128 AND length(trim(inverseLabel)) BETWEEN 1 AND 128),
	CONSTRAINT "RelationRole_replacement_check" CHECK(replacementSlug IS NULL OR replacementSlug <> slug),
	CONSTRAINT "RelationRole_storage_types_check" CHECK(typeof(slug) = 'text' AND typeof(forwardLabel) = 'text' AND typeof(inverseLabel) = 'text'
				AND typeof(isSymmetric) = 'integer' AND isSymmetric IN (0, 1)
				AND typeof(allowSelf) = 'integer' AND allowSelf IN (0, 1)
				AND typeof(deprecatedAt) IN ('null', 'integer') AND typeof(replacementSlug) IN ('null', 'text')
				AND typeof(createdAt) = 'integer' AND typeof(updatedAt) = 'integer')
);
--> statement-breakpoint
CREATE INDEX `RelationRole_deprecatedAt_idx` ON `RelationRole` (`deprecatedAt`);--> statement-breakpoint
CREATE INDEX `RelationRole_replacementSlug_idx` ON `RelationRole` (`replacementSlug`);--> statement-breakpoint
CREATE TABLE `SemanticRelation` (
	`id` text PRIMARY KEY NOT NULL,
	`sourceType` text NOT NULL,
	`sourceId` text NOT NULL,
	`targetType` text NOT NULL,
	`targetId` text NOT NULL,
	`roleSlug` text,
	`roleKey` text DEFAULT '' NOT NULL,
	`createdAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	`updatedAt` integer DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)) NOT NULL,
	FOREIGN KEY (`roleSlug`) REFERENCES `RelationRole`(`slug`) ON UPDATE cascade ON DELETE restrict,
	CONSTRAINT "SemanticRelation_id_check" CHECK(length(id) BETWEEN 1 AND 128 AND substr(id, 1, 1) GLOB '[A-Za-z0-9]'
				AND id NOT GLOB '*[^A-Za-z0-9_-]*'),
	CONSTRAINT "SemanticRelation_entity_type_check" CHECK(sourceType IN ('asset', 'folder', 'album', 'collection', 'group', 'character', 'place', 'concept', 'world_item', 'prompt', 'note', 'wildcard')
				AND targetType IN ('asset', 'folder', 'album', 'collection', 'group', 'character', 'place', 'concept', 'world_item', 'prompt', 'note', 'wildcard')),
	CONSTRAINT "SemanticRelation_endpoint_id_check" CHECK(length(sourceId) BETWEEN 1 AND 192 AND length(targetId) BETWEEN 1 AND 192
				AND instr(sourceId, char(0)) = 0 AND instr(targetId, char(0)) = 0),
	CONSTRAINT "SemanticRelation_role_key_check" CHECK((roleSlug IS NULL AND roleKey = '') OR (roleSlug IS NOT NULL AND roleKey = roleSlug)),
	CONSTRAINT "SemanticRelation_storage_types_check" CHECK(typeof(id) = 'text' AND typeof(sourceType) = 'text' AND typeof(sourceId) = 'text'
				AND typeof(targetType) = 'text' AND typeof(targetId) = 'text'
				AND typeof(roleSlug) IN ('null', 'text') AND typeof(roleKey) = 'text'
				AND typeof(createdAt) = 'integer' AND typeof(updatedAt) = 'integer')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `SemanticRelation_logical_identity_key` ON `SemanticRelation` (`sourceType`,`sourceId`,`targetType`,`targetId`,`roleKey`);--> statement-breakpoint
CREATE INDEX `SemanticRelation_source_idx` ON `SemanticRelation` (`sourceType`,`sourceId`);--> statement-breakpoint
CREATE INDEX `SemanticRelation_target_idx` ON `SemanticRelation` (`targetType`,`targetId`);--> statement-breakpoint
CREATE INDEX `SemanticRelation_roleSlug_idx` ON `SemanticRelation` (`roleSlug`);
--> statement-breakpoint
INSERT INTO `RelationRole` (`slug`, `forwardLabel`, `inverseLabel`, `isSymmetric`, `allowSelf`) VALUES
	('references', 'references', 'referenced_by', 0, 0),
	('inspired_by', 'inspired_by', 'inspires', 0, 0),
	('derived_from', 'derived_from', 'source_for', 0, 0),
	('variant_of', 'variant_of', 'variant_of', 1, 0);
--> statement-breakpoint
WITH families(value) AS (
	VALUES ('asset'), ('organizer'), ('narrative_entity'), ('prompt'), ('note'), ('wildcard')
)
INSERT INTO `RelationRoleApplicability` (`roleSlug`, `sourceFamily`, `targetFamily`)
SELECT role.slug, source.value, target.value
FROM (SELECT slug FROM `RelationRole` WHERE slug IN ('references', 'inspired_by', 'derived_from')) role
CROSS JOIN families source
CROSS JOIN families target;
--> statement-breakpoint
WITH families(value) AS (
	VALUES ('asset'), ('organizer'), ('narrative_entity'), ('prompt'), ('note'), ('wildcard')
)
INSERT INTO `RelationRoleApplicability` (`roleSlug`, `sourceFamily`, `targetFamily`)
SELECT 'variant_of', value, value FROM families;
--> statement-breakpoint
INSERT INTO `RelationRoleConflict` (`leftRoleSlug`, `rightRoleSlug`) VALUES ('derived_from', 'variant_of');
--> statement-breakpoint
CREATE TRIGGER `RelationRole_slug_immutable`
BEFORE UPDATE OF `slug` ON `RelationRole`
WHEN NEW.`slug` <> OLD.`slug`
BEGIN
	SELECT RAISE(ABORT, 'SEMANTIC_RELATION_ROLE_SLUG_IMMUTABLE');
END;
--> statement-breakpoint
CREATE TRIGGER `RelationRole_semantic_policy_update`
BEFORE UPDATE OF `isSymmetric`, `allowSelf` ON `RelationRole`
WHEN (NEW.`isSymmetric` <> OLD.`isSymmetric` OR NEW.`allowSelf` <> OLD.`allowSelf`)
	AND EXISTS (SELECT 1 FROM `SemanticRelation` relation WHERE relation.`roleSlug` = OLD.`slug`)
BEGIN
	SELECT RAISE(ABORT, 'SEMANTIC_RELATION_ROLE_POLICY_IN_USE');
END;
--> statement-breakpoint
CREATE TRIGGER `RelationRoleApplicability_semantic_policy_update`
BEFORE UPDATE ON `RelationRoleApplicability`
WHEN EXISTS (SELECT 1 FROM `SemanticRelation` relation WHERE relation.`roleSlug` = OLD.`roleSlug`)
BEGIN
	SELECT RAISE(ABORT, 'SEMANTIC_RELATION_ROLE_POLICY_IN_USE');
END;
--> statement-breakpoint
CREATE TRIGGER `RelationRoleApplicability_semantic_policy_delete`
BEFORE DELETE ON `RelationRoleApplicability`
WHEN EXISTS (SELECT 1 FROM `SemanticRelation` relation WHERE relation.`roleSlug` = OLD.`roleSlug`)
BEGIN
	SELECT RAISE(ABORT, 'SEMANTIC_RELATION_ROLE_POLICY_IN_USE');
END;
--> statement-breakpoint
CREATE TRIGGER `RelationRoleConflict_semantic_policy_insert`
BEFORE INSERT ON `RelationRoleConflict`
WHEN EXISTS (
	SELECT 1 FROM `SemanticRelation` relation
	WHERE relation.`roleSlug` IN (NEW.`leftRoleSlug`, NEW.`rightRoleSlug`)
)
BEGIN
	SELECT RAISE(ABORT, 'SEMANTIC_RELATION_ROLE_POLICY_IN_USE');
END;
--> statement-breakpoint
CREATE TRIGGER `RelationRoleConflict_semantic_policy_update`
BEFORE UPDATE ON `RelationRoleConflict`
WHEN EXISTS (
	SELECT 1 FROM `SemanticRelation` relation
	WHERE relation.`roleSlug` IN (OLD.`leftRoleSlug`, OLD.`rightRoleSlug`, NEW.`leftRoleSlug`, NEW.`rightRoleSlug`)
)
BEGIN
	SELECT RAISE(ABORT, 'SEMANTIC_RELATION_ROLE_POLICY_IN_USE');
END;
--> statement-breakpoint
CREATE TRIGGER `RelationRoleConflict_semantic_policy_delete`
BEFORE DELETE ON `RelationRoleConflict`
WHEN EXISTS (
	SELECT 1 FROM `SemanticRelation` relation
	WHERE relation.`roleSlug` IN (OLD.`leftRoleSlug`, OLD.`rightRoleSlug`)
)
BEGIN
	SELECT RAISE(ABORT, 'SEMANTIC_RELATION_ROLE_POLICY_IN_USE');
END;
--> statement-breakpoint
CREATE TRIGGER `SemanticRelation_role_contract_insert`
BEFORE INSERT ON `SemanticRelation`
WHEN NEW.`roleSlug` IS NOT NULL
BEGIN
	SELECT CASE WHEN NOT EXISTS (
		SELECT 1
		FROM `RelationRole` role
		JOIN `RelationRoleApplicability` applicability ON applicability.`roleSlug` = role.`slug`
		WHERE role.`slug` = NEW.`roleSlug`
			AND role.`deprecatedAt` IS NULL
			AND applicability.`sourceFamily` = CASE
				WHEN NEW.`sourceType` = 'asset' THEN 'asset'
				WHEN NEW.`sourceType` IN ('folder', 'album', 'collection', 'group') THEN 'organizer'
				WHEN NEW.`sourceType` IN ('character', 'place', 'concept', 'world_item') THEN 'narrative_entity'
				ELSE NEW.`sourceType`
			END
			AND applicability.`targetFamily` = CASE
				WHEN NEW.`targetType` = 'asset' THEN 'asset'
				WHEN NEW.`targetType` IN ('folder', 'album', 'collection', 'group') THEN 'organizer'
				WHEN NEW.`targetType` IN ('character', 'place', 'concept', 'world_item') THEN 'narrative_entity'
				ELSE NEW.`targetType`
			END
	) THEN RAISE(ABORT, 'SEMANTIC_RELATION_ROLE_NOT_APPLICABLE') END;
	SELECT CASE WHEN EXISTS (
		SELECT 1 FROM `RelationRole` role
		WHERE role.`slug` = NEW.`roleSlug` AND role.`isSymmetric` = 1
			AND ((NEW.`sourceType` COLLATE BINARY) > (NEW.`targetType` COLLATE BINARY)
				OR (NEW.`sourceType` = NEW.`targetType`
					AND (NEW.`sourceId` COLLATE BINARY) > (NEW.`targetId` COLLATE BINARY)))
	) THEN RAISE(ABORT, 'SEMANTIC_RELATION_NOT_CANONICAL') END;
	SELECT CASE WHEN NEW.`roleSlug` = 'variant_of' AND (
		NEW.`sourceType` <> NEW.`targetType`
		OR (NEW.`sourceType` = 'asset' AND EXISTS (
			SELECT 1 FROM `Asset` sourceAsset
			JOIN `Asset` targetAsset ON targetAsset.`id` = NEW.`targetId`
			WHERE sourceAsset.`id` = NEW.`sourceId`
				AND sourceAsset.`assetType` <> targetAsset.`assetType`
		))
	)
	THEN RAISE(ABORT, 'SEMANTIC_RELATION_VARIANT_TYPE_MISMATCH') END;
	SELECT CASE WHEN NEW.`sourceType` = NEW.`targetType` AND NEW.`sourceId` = NEW.`targetId`
		AND NOT EXISTS (SELECT 1 FROM `RelationRole` WHERE `slug` = NEW.`roleSlug` AND `allowSelf` = 1)
	THEN RAISE(ABORT, 'SEMANTIC_RELATION_SELF_LINK') END;
END;
--> statement-breakpoint
CREATE TRIGGER `SemanticRelation_role_contract_update`
BEFORE UPDATE OF `sourceType`, `sourceId`, `targetType`, `targetId`, `roleSlug`, `roleKey` ON `SemanticRelation`
BEGIN
	SELECT CASE WHEN NEW.`roleSlug` IS NOT NULL AND NOT EXISTS (
		SELECT 1
		FROM `RelationRole` role
		JOIN `RelationRoleApplicability` applicability ON applicability.`roleSlug` = role.`slug`
		WHERE role.`slug` = NEW.`roleSlug` AND role.`deprecatedAt` IS NULL
			AND applicability.`sourceFamily` = CASE
				WHEN NEW.`sourceType` = 'asset' THEN 'asset'
				WHEN NEW.`sourceType` IN ('folder', 'album', 'collection', 'group') THEN 'organizer'
				WHEN NEW.`sourceType` IN ('character', 'place', 'concept', 'world_item') THEN 'narrative_entity'
				ELSE NEW.`sourceType`
			END
			AND applicability.`targetFamily` = CASE
				WHEN NEW.`targetType` = 'asset' THEN 'asset'
				WHEN NEW.`targetType` IN ('folder', 'album', 'collection', 'group') THEN 'organizer'
				WHEN NEW.`targetType` IN ('character', 'place', 'concept', 'world_item') THEN 'narrative_entity'
				ELSE NEW.`targetType`
			END
	) THEN RAISE(ABORT, 'SEMANTIC_RELATION_ROLE_NOT_APPLICABLE') END;
	SELECT CASE WHEN EXISTS (
		SELECT 1 FROM `RelationRole` role
		WHERE role.`slug` = NEW.`roleSlug` AND role.`isSymmetric` = 1
			AND ((NEW.`sourceType` COLLATE BINARY) > (NEW.`targetType` COLLATE BINARY)
				OR (NEW.`sourceType` = NEW.`targetType`
					AND (NEW.`sourceId` COLLATE BINARY) > (NEW.`targetId` COLLATE BINARY)))
	) THEN RAISE(ABORT, 'SEMANTIC_RELATION_NOT_CANONICAL') END;
	SELECT CASE WHEN NEW.`roleSlug` = 'variant_of' AND (
		NEW.`sourceType` <> NEW.`targetType`
		OR (NEW.`sourceType` = 'asset' AND EXISTS (
			SELECT 1 FROM `Asset` sourceAsset
			JOIN `Asset` targetAsset ON targetAsset.`id` = NEW.`targetId`
			WHERE sourceAsset.`id` = NEW.`sourceId`
				AND sourceAsset.`assetType` <> targetAsset.`assetType`
		))
	)
	THEN RAISE(ABORT, 'SEMANTIC_RELATION_VARIANT_TYPE_MISMATCH') END;
	SELECT CASE WHEN NEW.`sourceType` = NEW.`targetType` AND NEW.`sourceId` = NEW.`targetId`
		AND (NEW.`roleSlug` IS NULL OR NOT EXISTS (
			SELECT 1 FROM `RelationRole` WHERE `slug` = NEW.`roleSlug` AND `allowSelf` = 1
		)) THEN RAISE(ABORT, 'SEMANTIC_RELATION_SELF_LINK') END;
END;
--> statement-breakpoint
CREATE TRIGGER `SemanticRelation_endpoint_contract_insert`
BEFORE INSERT ON `SemanticRelation`
BEGIN
	SELECT CASE WHEN NOT (
		(NEW.`sourceType` = 'asset' AND EXISTS (SELECT 1 FROM `Asset` WHERE `id` = NEW.`sourceId` AND `status` <> 'deleted'))
		OR (NEW.`sourceType` = 'folder' AND EXISTS (SELECT 1 FROM `Folder` WHERE `id` = NEW.`sourceId`))
		OR (NEW.`sourceType` = 'album' AND EXISTS (SELECT 1 FROM `Album` WHERE `id` = NEW.`sourceId`))
		OR (NEW.`sourceType` = 'collection' AND EXISTS (SELECT 1 FROM `Collection` WHERE `id` = NEW.`sourceId`))
		OR (NEW.`sourceType` = 'group' AND EXISTS (SELECT 1 FROM `Group` WHERE `id` = NEW.`sourceId`))
		OR (NEW.`sourceType` = 'character' AND EXISTS (SELECT 1 FROM `Character` WHERE `id` = NEW.`sourceId`))
		OR (NEW.`sourceType` = 'place' AND EXISTS (SELECT 1 FROM `Place` WHERE `id` = NEW.`sourceId`))
		OR (NEW.`sourceType` = 'concept' AND EXISTS (SELECT 1 FROM `Concept` WHERE `id` = NEW.`sourceId`))
		OR (NEW.`sourceType` = 'world_item' AND EXISTS (SELECT 1 FROM `WorldItem` WHERE `id` = NEW.`sourceId`))
		OR (NEW.`sourceType` = 'prompt' AND EXISTS (SELECT 1 FROM `Prompt` WHERE `id` = NEW.`sourceId`))
		OR (NEW.`sourceType` = 'note' AND EXISTS (SELECT 1 FROM `Note` WHERE `id` = NEW.`sourceId`))
		OR (NEW.`sourceType` = 'wildcard' AND EXISTS (SELECT 1 FROM `Wildcard` WHERE `id` = NEW.`sourceId`))
	) THEN RAISE(ABORT, 'SEMANTIC_RELATION_SOURCE_NOT_FOUND') END;
	SELECT CASE WHEN NOT (
		(NEW.`targetType` = 'asset' AND EXISTS (SELECT 1 FROM `Asset` WHERE `id` = NEW.`targetId` AND `status` <> 'deleted'))
		OR (NEW.`targetType` = 'folder' AND EXISTS (SELECT 1 FROM `Folder` WHERE `id` = NEW.`targetId`))
		OR (NEW.`targetType` = 'album' AND EXISTS (SELECT 1 FROM `Album` WHERE `id` = NEW.`targetId`))
		OR (NEW.`targetType` = 'collection' AND EXISTS (SELECT 1 FROM `Collection` WHERE `id` = NEW.`targetId`))
		OR (NEW.`targetType` = 'group' AND EXISTS (SELECT 1 FROM `Group` WHERE `id` = NEW.`targetId`))
		OR (NEW.`targetType` = 'character' AND EXISTS (SELECT 1 FROM `Character` WHERE `id` = NEW.`targetId`))
		OR (NEW.`targetType` = 'place' AND EXISTS (SELECT 1 FROM `Place` WHERE `id` = NEW.`targetId`))
		OR (NEW.`targetType` = 'concept' AND EXISTS (SELECT 1 FROM `Concept` WHERE `id` = NEW.`targetId`))
		OR (NEW.`targetType` = 'world_item' AND EXISTS (SELECT 1 FROM `WorldItem` WHERE `id` = NEW.`targetId`))
		OR (NEW.`targetType` = 'prompt' AND EXISTS (SELECT 1 FROM `Prompt` WHERE `id` = NEW.`targetId`))
		OR (NEW.`targetType` = 'note' AND EXISTS (SELECT 1 FROM `Note` WHERE `id` = NEW.`targetId`))
		OR (NEW.`targetType` = 'wildcard' AND EXISTS (SELECT 1 FROM `Wildcard` WHERE `id` = NEW.`targetId`))
	) THEN RAISE(ABORT, 'SEMANTIC_RELATION_TARGET_NOT_FOUND') END;
END;
--> statement-breakpoint
CREATE TRIGGER `SemanticRelation_endpoint_contract_update`
BEFORE UPDATE ON `SemanticRelation`
BEGIN
	SELECT CASE WHEN NOT (
		(NEW.`sourceType` = 'asset' AND EXISTS (SELECT 1 FROM `Asset` WHERE `id` = NEW.`sourceId` AND `status` <> 'deleted'))
		OR (NEW.`sourceType` = 'folder' AND EXISTS (SELECT 1 FROM `Folder` WHERE `id` = NEW.`sourceId`))
		OR (NEW.`sourceType` = 'album' AND EXISTS (SELECT 1 FROM `Album` WHERE `id` = NEW.`sourceId`))
		OR (NEW.`sourceType` = 'collection' AND EXISTS (SELECT 1 FROM `Collection` WHERE `id` = NEW.`sourceId`))
		OR (NEW.`sourceType` = 'group' AND EXISTS (SELECT 1 FROM `Group` WHERE `id` = NEW.`sourceId`))
		OR (NEW.`sourceType` = 'character' AND EXISTS (SELECT 1 FROM `Character` WHERE `id` = NEW.`sourceId`))
		OR (NEW.`sourceType` = 'place' AND EXISTS (SELECT 1 FROM `Place` WHERE `id` = NEW.`sourceId`))
		OR (NEW.`sourceType` = 'concept' AND EXISTS (SELECT 1 FROM `Concept` WHERE `id` = NEW.`sourceId`))
		OR (NEW.`sourceType` = 'world_item' AND EXISTS (SELECT 1 FROM `WorldItem` WHERE `id` = NEW.`sourceId`))
		OR (NEW.`sourceType` = 'prompt' AND EXISTS (SELECT 1 FROM `Prompt` WHERE `id` = NEW.`sourceId`))
		OR (NEW.`sourceType` = 'note' AND EXISTS (SELECT 1 FROM `Note` WHERE `id` = NEW.`sourceId`))
		OR (NEW.`sourceType` = 'wildcard' AND EXISTS (SELECT 1 FROM `Wildcard` WHERE `id` = NEW.`sourceId`))
	) THEN RAISE(ABORT, 'SEMANTIC_RELATION_SOURCE_NOT_FOUND') END;
	SELECT CASE WHEN NOT (
		(NEW.`targetType` = 'asset' AND EXISTS (SELECT 1 FROM `Asset` WHERE `id` = NEW.`targetId` AND `status` <> 'deleted'))
		OR (NEW.`targetType` = 'folder' AND EXISTS (SELECT 1 FROM `Folder` WHERE `id` = NEW.`targetId`))
		OR (NEW.`targetType` = 'album' AND EXISTS (SELECT 1 FROM `Album` WHERE `id` = NEW.`targetId`))
		OR (NEW.`targetType` = 'collection' AND EXISTS (SELECT 1 FROM `Collection` WHERE `id` = NEW.`targetId`))
		OR (NEW.`targetType` = 'group' AND EXISTS (SELECT 1 FROM `Group` WHERE `id` = NEW.`targetId`))
		OR (NEW.`targetType` = 'character' AND EXISTS (SELECT 1 FROM `Character` WHERE `id` = NEW.`targetId`))
		OR (NEW.`targetType` = 'place' AND EXISTS (SELECT 1 FROM `Place` WHERE `id` = NEW.`targetId`))
		OR (NEW.`targetType` = 'concept' AND EXISTS (SELECT 1 FROM `Concept` WHERE `id` = NEW.`targetId`))
		OR (NEW.`targetType` = 'world_item' AND EXISTS (SELECT 1 FROM `WorldItem` WHERE `id` = NEW.`targetId`))
		OR (NEW.`targetType` = 'prompt' AND EXISTS (SELECT 1 FROM `Prompt` WHERE `id` = NEW.`targetId`))
		OR (NEW.`targetType` = 'note' AND EXISTS (SELECT 1 FROM `Note` WHERE `id` = NEW.`targetId`))
		OR (NEW.`targetType` = 'wildcard' AND EXISTS (SELECT 1 FROM `Wildcard` WHERE `id` = NEW.`targetId`))
	) THEN RAISE(ABORT, 'SEMANTIC_RELATION_TARGET_NOT_FOUND') END;
END;
--> statement-breakpoint
CREATE TRIGGER `SemanticRelation_bare_self_insert`
BEFORE INSERT ON `SemanticRelation`
WHEN NEW.`roleSlug` IS NULL AND NEW.`sourceType` = NEW.`targetType` AND NEW.`sourceId` = NEW.`targetId`
BEGIN
	SELECT RAISE(ABORT, 'SEMANTIC_RELATION_SELF_LINK');
END;
--> statement-breakpoint
CREATE TRIGGER `SemanticRelation_pair_semantics_insert`
BEFORE INSERT ON `SemanticRelation`
BEGIN
	SELECT CASE WHEN EXISTS (
		SELECT 1 FROM `SemanticRelation` existing
		WHERE (
			(existing.`roleSlug` IS NULL AND NEW.`roleSlug` IS NULL
				AND existing.`sourceType` = NEW.`sourceType` AND existing.`sourceId` = NEW.`sourceId`
				AND existing.`targetType` = NEW.`targetType` AND existing.`targetId` = NEW.`targetId`)
			OR (((existing.`roleSlug` IS NULL AND NEW.`roleSlug` IS NOT NULL)
					OR (existing.`roleSlug` IS NOT NULL AND NEW.`roleSlug` IS NULL))
				AND existing.`sourceType` = NEW.`sourceType` AND existing.`sourceId` = NEW.`sourceId`
				AND existing.`targetType` = NEW.`targetType` AND existing.`targetId` = NEW.`targetId`
			)
		)
	) THEN RAISE(ABORT, 'SEMANTIC_RELATION_BARE_CONFLICT') END;
	SELECT CASE WHEN NEW.`roleSlug` IS NOT NULL AND EXISTS (
		SELECT 1
		FROM `SemanticRelation` existing
		JOIN `RelationRoleConflict` conflict
			ON (conflict.`leftRoleSlug` = NEW.`roleSlug` AND conflict.`rightRoleSlug` = existing.`roleSlug`)
			OR (conflict.`rightRoleSlug` = NEW.`roleSlug` AND conflict.`leftRoleSlug` = existing.`roleSlug`)
		WHERE (existing.`sourceType` = NEW.`sourceType` AND existing.`sourceId` = NEW.`sourceId`
			AND existing.`targetType` = NEW.`targetType` AND existing.`targetId` = NEW.`targetId`)
			OR (existing.`sourceType` = NEW.`targetType` AND existing.`sourceId` = NEW.`targetId`
				AND existing.`targetType` = NEW.`sourceType` AND existing.`targetId` = NEW.`sourceId`)
	) THEN RAISE(ABORT, 'SEMANTIC_RELATION_ROLE_CONFLICT') END;
END;
--> statement-breakpoint
CREATE TRIGGER `SemanticRelation_pair_semantics_update`
BEFORE UPDATE OF `sourceType`, `sourceId`, `targetType`, `targetId`, `roleSlug` ON `SemanticRelation`
BEGIN
	SELECT CASE WHEN EXISTS (
		SELECT 1 FROM `SemanticRelation` existing
		WHERE existing.`id` <> OLD.`id` AND (
			(existing.`roleSlug` IS NULL AND NEW.`roleSlug` IS NULL
				AND existing.`sourceType` = NEW.`sourceType` AND existing.`sourceId` = NEW.`sourceId`
				AND existing.`targetType` = NEW.`targetType` AND existing.`targetId` = NEW.`targetId`)
			OR (((existing.`roleSlug` IS NULL AND NEW.`roleSlug` IS NOT NULL)
					OR (existing.`roleSlug` IS NOT NULL AND NEW.`roleSlug` IS NULL))
				AND existing.`sourceType` = NEW.`sourceType` AND existing.`sourceId` = NEW.`sourceId`
				AND existing.`targetType` = NEW.`targetType` AND existing.`targetId` = NEW.`targetId`
			)
		)
	) THEN RAISE(ABORT, 'SEMANTIC_RELATION_BARE_CONFLICT') END;
	SELECT CASE WHEN NEW.`roleSlug` IS NOT NULL AND EXISTS (
		SELECT 1
		FROM `SemanticRelation` existing
		JOIN `RelationRoleConflict` conflict
			ON (conflict.`leftRoleSlug` = NEW.`roleSlug` AND conflict.`rightRoleSlug` = existing.`roleSlug`)
			OR (conflict.`rightRoleSlug` = NEW.`roleSlug` AND conflict.`leftRoleSlug` = existing.`roleSlug`)
		WHERE existing.`id` <> OLD.`id` AND (
			(existing.`sourceType` = NEW.`sourceType` AND existing.`sourceId` = NEW.`sourceId`
				AND existing.`targetType` = NEW.`targetType` AND existing.`targetId` = NEW.`targetId`)
			OR (existing.`sourceType` = NEW.`targetType` AND existing.`sourceId` = NEW.`targetId`
				AND existing.`targetType` = NEW.`sourceType` AND existing.`targetId` = NEW.`sourceId`)
		)
	) THEN RAISE(ABORT, 'SEMANTIC_RELATION_ROLE_CONFLICT') END;
END;
--> statement-breakpoint
CREATE TRIGGER `SemanticRelation_derived_cycle_insert`
BEFORE INSERT ON `SemanticRelation`
WHEN NEW.`roleSlug` = 'derived_from'
BEGIN
	SELECT CASE WHEN EXISTS (
		WITH RECURSIVE ancestry(entityType, entityId) AS (
			SELECT NEW.`targetType`, NEW.`targetId`
			UNION
			SELECT relation.`targetType`, relation.`targetId`
			FROM `SemanticRelation` relation
			JOIN ancestry ON relation.`sourceType` = ancestry.entityType AND relation.`sourceId` = ancestry.entityId
			WHERE relation.`roleSlug` = 'derived_from'
		)
		SELECT 1 FROM ancestry WHERE entityType = NEW.`sourceType` AND entityId = NEW.`sourceId`
	) THEN RAISE(ABORT, 'SEMANTIC_RELATION_DERIVED_CYCLE') END;
END;
--> statement-breakpoint
CREATE TRIGGER `SemanticRelation_derived_cycle_update`
BEFORE UPDATE OF `sourceType`, `sourceId`, `targetType`, `targetId`, `roleSlug` ON `SemanticRelation`
WHEN NEW.`roleSlug` = 'derived_from'
BEGIN
	SELECT CASE WHEN EXISTS (
		WITH RECURSIVE ancestry(entityType, entityId) AS (
			SELECT NEW.`targetType`, NEW.`targetId`
			UNION
			SELECT relation.`targetType`, relation.`targetId`
			FROM `SemanticRelation` relation
			JOIN ancestry ON relation.`sourceType` = ancestry.entityType AND relation.`sourceId` = ancestry.entityId
			WHERE relation.`roleSlug` = 'derived_from' AND relation.`id` <> OLD.`id`
		)
		SELECT 1 FROM ancestry WHERE entityType = NEW.`sourceType` AND entityId = NEW.`sourceId`
	) THEN RAISE(ABORT, 'SEMANTIC_RELATION_DERIVED_CYCLE') END;
END;
--> statement-breakpoint
CREATE TRIGGER `SemanticRelation_asset_delete` AFTER DELETE ON `Asset`
BEGIN DELETE FROM `SemanticRelation` WHERE (`sourceType` = 'asset' AND `sourceId` = OLD.`id`) OR (`targetType` = 'asset' AND `targetId` = OLD.`id`); END;
--> statement-breakpoint
CREATE TRIGGER `SemanticRelation_folder_delete` AFTER DELETE ON `Folder`
BEGIN DELETE FROM `SemanticRelation` WHERE (`sourceType` = 'folder' AND `sourceId` = OLD.`id`) OR (`targetType` = 'folder' AND `targetId` = OLD.`id`); END;
--> statement-breakpoint
CREATE TRIGGER `SemanticRelation_album_delete` AFTER DELETE ON `Album`
BEGIN DELETE FROM `SemanticRelation` WHERE (`sourceType` = 'album' AND `sourceId` = OLD.`id`) OR (`targetType` = 'album' AND `targetId` = OLD.`id`); END;
--> statement-breakpoint
CREATE TRIGGER `SemanticRelation_collection_delete` AFTER DELETE ON `Collection`
BEGIN DELETE FROM `SemanticRelation` WHERE (`sourceType` = 'collection' AND `sourceId` = OLD.`id`) OR (`targetType` = 'collection' AND `targetId` = OLD.`id`); END;
--> statement-breakpoint
CREATE TRIGGER `SemanticRelation_group_delete` AFTER DELETE ON `Group`
BEGIN DELETE FROM `SemanticRelation` WHERE (`sourceType` = 'group' AND `sourceId` = OLD.`id`) OR (`targetType` = 'group' AND `targetId` = OLD.`id`); END;
--> statement-breakpoint
CREATE TRIGGER `SemanticRelation_character_delete` AFTER DELETE ON `Character`
BEGIN DELETE FROM `SemanticRelation` WHERE (`sourceType` = 'character' AND `sourceId` = OLD.`id`) OR (`targetType` = 'character' AND `targetId` = OLD.`id`); END;
--> statement-breakpoint
CREATE TRIGGER `SemanticRelation_place_delete` AFTER DELETE ON `Place`
BEGIN DELETE FROM `SemanticRelation` WHERE (`sourceType` = 'place' AND `sourceId` = OLD.`id`) OR (`targetType` = 'place' AND `targetId` = OLD.`id`); END;
--> statement-breakpoint
CREATE TRIGGER `SemanticRelation_concept_delete` AFTER DELETE ON `Concept`
BEGIN DELETE FROM `SemanticRelation` WHERE (`sourceType` = 'concept' AND `sourceId` = OLD.`id`) OR (`targetType` = 'concept' AND `targetId` = OLD.`id`); END;
--> statement-breakpoint
CREATE TRIGGER `SemanticRelation_world_item_delete` AFTER DELETE ON `WorldItem`
BEGIN DELETE FROM `SemanticRelation` WHERE (`sourceType` = 'world_item' AND `sourceId` = OLD.`id`) OR (`targetType` = 'world_item' AND `targetId` = OLD.`id`); END;
--> statement-breakpoint
CREATE TRIGGER `SemanticRelation_prompt_delete` AFTER DELETE ON `Prompt`
BEGIN DELETE FROM `SemanticRelation` WHERE (`sourceType` = 'prompt' AND `sourceId` = OLD.`id`) OR (`targetType` = 'prompt' AND `targetId` = OLD.`id`); END;
--> statement-breakpoint
CREATE TRIGGER `SemanticRelation_note_delete` AFTER DELETE ON `Note`
BEGIN DELETE FROM `SemanticRelation` WHERE (`sourceType` = 'note' AND `sourceId` = OLD.`id`) OR (`targetType` = 'note' AND `targetId` = OLD.`id`); END;
--> statement-breakpoint
CREATE TRIGGER `SemanticRelation_wildcard_delete` AFTER DELETE ON `Wildcard`
BEGIN DELETE FROM `SemanticRelation` WHERE (`sourceType` = 'wildcard' AND `sourceId` = OLD.`id`) OR (`targetType` = 'wildcard' AND `targetId` = OLD.`id`); END;
--> statement-breakpoint
CREATE TRIGGER `TaxonomyArtifact_portable_location_insert`
BEFORE INSERT ON `TaxonomyArtifact`
BEGIN
	SELECT CASE WHEN NOT (
		NEW.`entityId` GLOB '[A-Za-z0-9]*' AND NEW.`entityId` NOT GLOB '*[^A-Za-z0-9_-]*' AND length(NEW.`entityId`) BETWEEN 1 AND 128
		AND substr(NEW.`relativePath`, 1, length(CASE NEW.`entityType`
			WHEN 'note' THEN 'taxonomy/notes/'
			WHEN 'prompt' THEN 'taxonomy/prompts/'
			WHEN 'wildcard' THEN 'taxonomy/wildcards/'
		END)) = CASE NEW.`entityType`
			WHEN 'note' THEN 'taxonomy/notes/'
			WHEN 'prompt' THEN 'taxonomy/prompts/'
			WHEN 'wildcard' THEN 'taxonomy/wildcards/'
		END
		AND length(substr(NEW.`relativePath`, length(CASE NEW.`entityType`
			WHEN 'note' THEN 'taxonomy/notes/'
			WHEN 'prompt' THEN 'taxonomy/prompts/'
			WHEN 'wildcard' THEN 'taxonomy/wildcards/'
		END) + 1)) BETWEEN 4 AND 131
		AND substr(substr(NEW.`relativePath`, length(CASE NEW.`entityType`
			WHEN 'note' THEN 'taxonomy/notes/'
			WHEN 'prompt' THEN 'taxonomy/prompts/'
			WHEN 'wildcard' THEN 'taxonomy/wildcards/'
		END) + 1), 1, 1) GLOB '[A-Za-z0-9]'
		AND substr(NEW.`relativePath`, -3) = '.md'
		AND substr(NEW.`relativePath`, length(CASE NEW.`entityType`
			WHEN 'note' THEN 'taxonomy/notes/'
			WHEN 'prompt' THEN 'taxonomy/prompts/'
			WHEN 'wildcard' THEN 'taxonomy/wildcards/'
		END) + 1) NOT GLOB '*[^A-Za-z0-9._-]*'
		AND lower(substr(substr(NEW.`relativePath`, length(CASE NEW.`entityType`
			WHEN 'note' THEN 'taxonomy/notes/'
			WHEN 'prompt' THEN 'taxonomy/prompts/'
			WHEN 'wildcard' THEN 'taxonomy/wildcards/'
		END) + 1), 1, instr(substr(NEW.`relativePath`, length(CASE NEW.`entityType`
			WHEN 'note' THEN 'taxonomy/notes/'
			WHEN 'prompt' THEN 'taxonomy/prompts/'
			WHEN 'wildcard' THEN 'taxonomy/wildcards/'
		END) + 1), '.') - 1))
			NOT IN ('con', 'prn', 'aux', 'nul', 'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9', 'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9')
	) THEN RAISE(ABORT, 'TAXONOMY_ARTIFACT_PORTABLE_LOCATION') END;
END;
--> statement-breakpoint
CREATE TRIGGER `TaxonomyArtifact_portable_location_update`
BEFORE UPDATE OF `entityType`, `entityId`, `relativePath` ON `TaxonomyArtifact`
BEGIN
	SELECT CASE WHEN NOT (
		NEW.`entityId` GLOB '[A-Za-z0-9]*' AND NEW.`entityId` NOT GLOB '*[^A-Za-z0-9_-]*' AND length(NEW.`entityId`) BETWEEN 1 AND 128
		AND substr(NEW.`relativePath`, 1, length(CASE NEW.`entityType`
			WHEN 'note' THEN 'taxonomy/notes/'
			WHEN 'prompt' THEN 'taxonomy/prompts/'
			WHEN 'wildcard' THEN 'taxonomy/wildcards/'
		END)) = CASE NEW.`entityType`
			WHEN 'note' THEN 'taxonomy/notes/'
			WHEN 'prompt' THEN 'taxonomy/prompts/'
			WHEN 'wildcard' THEN 'taxonomy/wildcards/'
		END
		AND length(substr(NEW.`relativePath`, length(CASE NEW.`entityType`
			WHEN 'note' THEN 'taxonomy/notes/'
			WHEN 'prompt' THEN 'taxonomy/prompts/'
			WHEN 'wildcard' THEN 'taxonomy/wildcards/'
		END) + 1)) BETWEEN 4 AND 131
		AND substr(substr(NEW.`relativePath`, length(CASE NEW.`entityType`
			WHEN 'note' THEN 'taxonomy/notes/'
			WHEN 'prompt' THEN 'taxonomy/prompts/'
			WHEN 'wildcard' THEN 'taxonomy/wildcards/'
		END) + 1), 1, 1) GLOB '[A-Za-z0-9]'
		AND substr(NEW.`relativePath`, -3) = '.md'
		AND substr(NEW.`relativePath`, length(CASE NEW.`entityType`
			WHEN 'note' THEN 'taxonomy/notes/'
			WHEN 'prompt' THEN 'taxonomy/prompts/'
			WHEN 'wildcard' THEN 'taxonomy/wildcards/'
		END) + 1) NOT GLOB '*[^A-Za-z0-9._-]*'
		AND lower(substr(substr(NEW.`relativePath`, length(CASE NEW.`entityType`
			WHEN 'note' THEN 'taxonomy/notes/'
			WHEN 'prompt' THEN 'taxonomy/prompts/'
			WHEN 'wildcard' THEN 'taxonomy/wildcards/'
		END) + 1), 1, instr(substr(NEW.`relativePath`, length(CASE NEW.`entityType`
			WHEN 'note' THEN 'taxonomy/notes/'
			WHEN 'prompt' THEN 'taxonomy/prompts/'
			WHEN 'wildcard' THEN 'taxonomy/wildcards/'
		END) + 1), '.') - 1))
			NOT IN ('con', 'prn', 'aux', 'nul', 'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9', 'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9')
	) THEN RAISE(ABORT, 'TAXONOMY_ARTIFACT_PORTABLE_LOCATION') END;
END;
--> statement-breakpoint
CREATE TRIGGER `TaxonomyArtifact_prompt_inline_update_guard`
BEFORE UPDATE ON `Prompt`
WHEN EXISTS (SELECT 1 FROM `TaxonomyArtifact` WHERE `entityType` = 'prompt' AND `entityId` = OLD.`id`)
	AND NOT EXISTS (SELECT 1 FROM `TaxonomyArtifactMutationPermit` WHERE `entityType` = 'prompt' AND `entityId` = OLD.`id` AND `operation` = 'update')
BEGIN SELECT RAISE(ABORT, 'ARTIFACT_FILE_BACKED'); END;
--> statement-breakpoint
CREATE TRIGGER `TaxonomyArtifact_prompt_inline_delete_guard`
BEFORE DELETE ON `Prompt`
WHEN EXISTS (SELECT 1 FROM `TaxonomyArtifact` WHERE `entityType` = 'prompt' AND `entityId` = OLD.`id`)
	AND NOT EXISTS (SELECT 1 FROM `TaxonomyArtifactMutationPermit` WHERE `entityType` = 'prompt' AND `entityId` = OLD.`id` AND `operation` = 'delete')
BEGIN SELECT RAISE(ABORT, 'ARTIFACT_FILE_BACKED'); END;
--> statement-breakpoint
CREATE TRIGGER `TaxonomyArtifact_note_inline_update_guard`
BEFORE UPDATE ON `Note`
WHEN EXISTS (SELECT 1 FROM `TaxonomyArtifact` WHERE `entityType` = 'note' AND `entityId` = OLD.`id`)
	AND NOT EXISTS (SELECT 1 FROM `TaxonomyArtifactMutationPermit` WHERE `entityType` = 'note' AND `entityId` = OLD.`id` AND `operation` = 'update')
BEGIN SELECT RAISE(ABORT, 'ARTIFACT_FILE_BACKED'); END;
--> statement-breakpoint
CREATE TRIGGER `TaxonomyArtifact_note_inline_delete_guard`
BEFORE DELETE ON `Note`
WHEN EXISTS (SELECT 1 FROM `TaxonomyArtifact` WHERE `entityType` = 'note' AND `entityId` = OLD.`id`)
	AND NOT EXISTS (SELECT 1 FROM `TaxonomyArtifactMutationPermit` WHERE `entityType` = 'note' AND `entityId` = OLD.`id` AND `operation` = 'delete')
BEGIN SELECT RAISE(ABORT, 'ARTIFACT_FILE_BACKED'); END;
--> statement-breakpoint
CREATE TRIGGER `TaxonomyArtifact_wildcard_inline_update_guard`
BEFORE UPDATE ON `Wildcard`
WHEN EXISTS (SELECT 1 FROM `TaxonomyArtifact` WHERE `entityType` = 'wildcard' AND `entityId` = OLD.`id`)
	AND NOT EXISTS (SELECT 1 FROM `TaxonomyArtifactMutationPermit` WHERE `entityType` = 'wildcard' AND `entityId` = OLD.`id` AND `operation` = 'update')
BEGIN SELECT RAISE(ABORT, 'ARTIFACT_FILE_BACKED'); END;
--> statement-breakpoint
CREATE TRIGGER `TaxonomyArtifact_wildcard_inline_delete_guard`
BEFORE DELETE ON `Wildcard`
WHEN EXISTS (SELECT 1 FROM `TaxonomyArtifact` WHERE `entityType` = 'wildcard' AND `entityId` = OLD.`id`)
	AND NOT EXISTS (SELECT 1 FROM `TaxonomyArtifactMutationPermit` WHERE `entityType` = 'wildcard' AND `entityId` = OLD.`id` AND `operation` = 'delete')
BEGIN SELECT RAISE(ABORT, 'ARTIFACT_FILE_BACKED'); END;
--> statement-breakpoint
CREATE TABLE `TaxonomyArtifactDeletionLedger` (
	`rootId` text NOT NULL,
	`relativePath` text NOT NULL,
	`entityType` text NOT NULL,
	`entityId` text NOT NULL,
	`contentHash` text NOT NULL,
	`nonce` text NOT NULL,
	`createdAt` integer NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER)),
	CONSTRAINT `TaxonomyArtifactDeletionLedger_pk` PRIMARY KEY(`rootId`, `relativePath`, `entityType`, `entityId`, `contentHash`, `nonce`),
	CONSTRAINT `TaxonomyArtifactDeletionLedger_entity_type_check` CHECK(`entityType` IN ('prompt', 'note', 'wildcard')),
	CONSTRAINT `TaxonomyArtifactDeletionLedger_content_hash_check` CHECK(length(`contentHash`) = 64 AND `contentHash` = lower(`contentHash`) AND `contentHash` NOT GLOB '*[^0-9a-f]*'),
	CONSTRAINT `TaxonomyArtifactDeletionLedger_nonce_check` CHECK(length(`nonce`) = 36 AND `nonce` = lower(`nonce`) AND `nonce` NOT GLOB '*[^0-9a-f-]*' AND substr(`nonce`, 9, 1) = '-' AND substr(`nonce`, 14, 1) = '-' AND substr(`nonce`, 19, 1) = '-' AND substr(`nonce`, 24, 1) = '-'),
	CONSTRAINT `TaxonomyArtifactDeletionLedger_relative_path_check` CHECK(length(`relativePath`) BETWEEN 1 AND 2048 AND substr(`relativePath`, 1, 1) <> '/' AND instr(`relativePath`, '\\') = 0 AND instr(`relativePath`, char(0)) = 0 AND instr('/' || `relativePath` || '/', '/../') = 0 AND instr('/' || `relativePath` || '/', '/./') = 0),
	CONSTRAINT `TaxonomyArtifactDeletionLedger_storage_types_check` CHECK(typeof(`rootId`) = 'text' AND typeof(`relativePath`) = 'text' AND typeof(`entityType`) = 'text' AND typeof(`entityId`) = 'text' AND typeof(`contentHash`) = 'text' AND typeof(`nonce`) = 'text' AND typeof(`createdAt`) = 'integer' AND `createdAt` >= 0),
	FOREIGN KEY (`rootId`) REFERENCES `MediaRoot`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `TaxonomyArtifactDeletionLedger_nonce_key` ON `TaxonomyArtifactDeletionLedger` (`nonce`);
--> statement-breakpoint
CREATE INDEX `TaxonomyArtifactDeletionLedger_root_path_entity_idx` ON `TaxonomyArtifactDeletionLedger` (`rootId`, `relativePath`, `entityType`, `entityId`);
