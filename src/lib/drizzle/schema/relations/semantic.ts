import { sql } from 'drizzle-orm';
import {
	type AnySQLiteColumn,
	check,
	index,
	integer,
	primaryKey,
	sqliteTable,
	text,
	uniqueIndex,
} from 'drizzle-orm/sqlite-core';

const epochMilliseconds = sql`(CAST(strftime('%s', 'now') AS INTEGER) * 1000 + CAST(substr(strftime('%f', 'now'), 4, 3) AS INTEGER))`;

export const SEMANTIC_RELATION_FAMILIES = [
	'asset',
	'organizer',
	'narrative_entity',
	'prompt',
	'note',
	'wildcard',
] as const;

export const SEMANTIC_RELATION_ENTITY_TYPES = [
	'asset',
	'folder',
	'album',
	'collection',
	'group',
	'character',
	'place',
	'concept',
	'world_item',
	'prompt',
	'note',
	'wildcard',
] as const;

export const relationRoles = sqliteTable(
	'RelationRole',
	{
		slug: text('slug').primaryKey(),
		forwardLabel: text('forwardLabel').notNull(),
		inverseLabel: text('inverseLabel').notNull(),
		isSymmetric: integer('isSymmetric', { mode: 'boolean' }).notNull().default(false),
		allowSelf: integer('allowSelf', { mode: 'boolean' }).notNull().default(false),
		deprecatedAt: integer('deprecatedAt', { mode: 'timestamp_ms' }),
		replacementSlug: text('replacementSlug').references((): AnySQLiteColumn => relationRoles.slug, {
			onDelete: 'restrict',
			onUpdate: 'cascade',
		}),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(epochMilliseconds),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(epochMilliseconds)
			.$onUpdate(() => new Date()),
	},
	(table) => ({
		activeIdx: index('RelationRole_deprecatedAt_idx').on(table.deprecatedAt),
		replacementIdx: index('RelationRole_replacementSlug_idx').on(table.replacementSlug),
		slugCheck: check(
			'RelationRole_slug_check',
			sql`length(slug) BETWEEN 1 AND 64 AND slug = lower(slug)
				AND substr(slug, 1, 1) GLOB '[a-z]' AND slug NOT GLOB '*[^a-z0-9_]*'`
		),
		labelsCheck: check(
			'RelationRole_labels_check',
			sql`length(trim(forwardLabel)) BETWEEN 1 AND 128 AND length(trim(inverseLabel)) BETWEEN 1 AND 128`
		),
		replacementCheck: check('RelationRole_replacement_check', sql`replacementSlug IS NULL OR replacementSlug <> slug`),
		storageTypesCheck: check(
			'RelationRole_storage_types_check',
			sql`typeof(slug) = 'text' AND typeof(forwardLabel) = 'text' AND typeof(inverseLabel) = 'text'
				AND typeof(isSymmetric) = 'integer' AND isSymmetric IN (0, 1)
				AND typeof(allowSelf) = 'integer' AND allowSelf IN (0, 1)
				AND typeof(deprecatedAt) IN ('null', 'integer') AND typeof(replacementSlug) IN ('null', 'text')
				AND typeof(createdAt) = 'integer' AND typeof(updatedAt) = 'integer'`
		),
	})
);

export const relationRoleApplicability = sqliteTable(
	'RelationRoleApplicability',
	{
		roleSlug: text('roleSlug')
			.notNull()
			.references(() => relationRoles.slug, { onDelete: 'cascade', onUpdate: 'cascade' }),
		sourceFamily: text('sourceFamily').notNull(),
		targetFamily: text('targetFamily').notNull(),
	},
	(table) => ({
		pk: primaryKey({
			columns: [table.roleSlug, table.sourceFamily, table.targetFamily],
			name: 'RelationRoleApplicability_pk',
		}),
		inverseIdx: index('RelationRoleApplicability_target_idx').on(
			table.targetFamily,
			table.sourceFamily,
			table.roleSlug
		),
		familyCheck: check(
			'RelationRoleApplicability_family_check',
			sql`sourceFamily IN ('asset', 'organizer', 'narrative_entity', 'prompt', 'note', 'wildcard')
				AND targetFamily IN ('asset', 'organizer', 'narrative_entity', 'prompt', 'note', 'wildcard')`
		),
	})
);

export const relationRoleConflicts = sqliteTable(
	'RelationRoleConflict',
	{
		leftRoleSlug: text('leftRoleSlug')
			.notNull()
			.references(() => relationRoles.slug, { onDelete: 'cascade', onUpdate: 'cascade' }),
		rightRoleSlug: text('rightRoleSlug')
			.notNull()
			.references(() => relationRoles.slug, { onDelete: 'cascade', onUpdate: 'cascade' }),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.leftRoleSlug, table.rightRoleSlug], name: 'RelationRoleConflict_pk' }),
		canonicalOrderCheck: check('RelationRoleConflict_canonical_order_check', sql`leftRoleSlug < rightRoleSlug`),
	})
);

export const semanticRelations = sqliteTable(
	'SemanticRelation',
	{
		id: text('id').primaryKey(),
		sourceType: text('sourceType').notNull(),
		sourceId: text('sourceId').notNull(),
		targetType: text('targetType').notNull(),
		targetId: text('targetId').notNull(),
		roleSlug: text('roleSlug').references(() => relationRoles.slug, {
			onDelete: 'restrict',
			onUpdate: 'cascade',
		}),
		roleKey: text('roleKey').notNull().default(''),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(epochMilliseconds),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(epochMilliseconds)
			.$onUpdate(() => new Date()),
	},
	(table) => ({
		logicalIdentity: uniqueIndex('SemanticRelation_logical_identity_key').on(
			table.sourceType,
			table.sourceId,
			table.targetType,
			table.targetId,
			table.roleKey
		),
		sourceIdx: index('SemanticRelation_source_idx').on(table.sourceType, table.sourceId),
		targetIdx: index('SemanticRelation_target_idx').on(table.targetType, table.targetId),
		roleIdx: index('SemanticRelation_roleSlug_idx').on(table.roleSlug),
		idCheck: check(
			'SemanticRelation_id_check',
			sql`length(id) BETWEEN 1 AND 128 AND substr(id, 1, 1) GLOB '[A-Za-z0-9]'
				AND id NOT GLOB '*[^A-Za-z0-9_-]*'`
		),
		entityTypeCheck: check(
			'SemanticRelation_entity_type_check',
			sql`sourceType IN ('asset', 'folder', 'album', 'collection', 'group', 'character', 'place', 'concept', 'world_item', 'prompt', 'note', 'wildcard')
				AND targetType IN ('asset', 'folder', 'album', 'collection', 'group', 'character', 'place', 'concept', 'world_item', 'prompt', 'note', 'wildcard')`
		),
		endpointIdCheck: check(
			'SemanticRelation_endpoint_id_check',
			sql`length(sourceId) BETWEEN 1 AND 192 AND length(targetId) BETWEEN 1 AND 192
				AND instr(sourceId, char(0)) = 0 AND instr(targetId, char(0)) = 0`
		),
		roleKeyCheck: check(
			'SemanticRelation_role_key_check',
			sql`(roleSlug IS NULL AND roleKey = '') OR (roleSlug IS NOT NULL AND roleKey = roleSlug)`
		),
		storageTypesCheck: check(
			'SemanticRelation_storage_types_check',
			sql`typeof(id) = 'text' AND typeof(sourceType) = 'text' AND typeof(sourceId) = 'text'
				AND typeof(targetType) = 'text' AND typeof(targetId) = 'text'
				AND typeof(roleSlug) IN ('null', 'text') AND typeof(roleKey) = 'text'
				AND typeof(createdAt) = 'integer' AND typeof(updatedAt) = 'integer'`
		),
	})
);
