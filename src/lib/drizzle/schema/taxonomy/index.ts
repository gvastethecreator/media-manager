/**
 * =================================================================================
 * TAXONOMY DOMAIN SCHEMA - DRIZZLE ORM
 * =================================================================================
 * Definiciones de tablas para el dominio Taxonomy del sistema
 *
 * Tablas incluidas:
 * - tags: Etiquetas para clasificación
 * - properties: Propiedades de elementos
 * - wildcards: Comodines para búsquedas
 * - characters: Personajes del sistema
 * - places: Lugares y ubicaciones
 * - worldItems: Objetos del mundo
 * - concepts: Conceptos abstractos
 * - prompts: Prompts para generación
 * - notes: Notas del sistema
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Modelo para las etiquetas
export const tags = sqliteTable(
	'Tag',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		emoji: text('emoji').default('🏷️'),
		color: text('color').default('#3b82f6'),
		category: text('category'),
		shortcut: text('shortcut'),
		featuredImage: text('featuredImage'),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		parentId: text('parentId'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('Tag_name_key').on(table.name),
	})
);

// Modelo para las propiedades
export const properties = sqliteTable(
	'Property',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		emoji: text('emoji').default('🔍'),
		color: text('color').default('#3b82f6'),
		category: text('category'),
		shortcut: text('shortcut'),
		featuredImage: text('featuredImage'),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('Property_name_key').on(table.name),
	})
);

// Modelo para los comodines
export const wildcards = sqliteTable(
	'Wildcard',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		emoji: text('emoji').default('🎭'),
		color: text('color').default('#3b82f6'),
		category: text('category'),
		shortcut: text('shortcut'),
		children: text('children'),
		featuredImage: text('featuredImage'),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		parentId: text('parentId'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('Wildcard_name_key').on(table.name),
	})
);

// Modelo para los personajes
export const characters = sqliteTable(
	'Character',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		emoji: text('emoji').default('👤'),
		color: text('color').default('#3b82f6'),
		category: text('category'),

		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		totalImages: integer('totalImages').notNull().default(0),
		totalVideos: integer('totalVideos').notNull().default(0),
		age: text('age'),
		gender: text('gender'),
		species: text('species'),
		occupation: text('occupation'),
		personality: text('personality'),
		background: text('background'),
		relationships: text('relationships'),
		skills: text('skills'),
		equipment: text('equipment'),
		notes: text('notes'),
		featuredImage: text('featuredImage'),
		parentId: text('parentId'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('Character_name_key').on(table.name),
	})
);

// Modelo para los lugares
export const places = sqliteTable(
	'Place',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		emoji: text('emoji').default('📍'),
		color: text('color').default('#3b82f6'),
		category: text('category'),

		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		totalImages: integer('totalImages').notNull().default(0),
		totalVideos: integer('totalVideos').notNull().default(0),
		type: text('type'),
		location: text('location'),
		climate: text('climate'),
		population: text('population'),
		government: text('government'),
		economy: text('economy'),
		culture: text('culture'),
		history: text('history'),
		geography: text('geography'),
		landmarks: text('landmarks'),
		dangers: text('dangers'),
		resources: text('resources'),
		notes: text('notes'),
		featuredImage: text('featuredImage'),
		parentId: text('parentId'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('Place_name_key').on(table.name),
	})
);

// Modelo para los objetos del mundo
export const worldItems = sqliteTable(
	'WorldItem',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		emoji: text('emoji').default('🎯'),
		color: text('color').default('#3b82f6'),
		category: text('category'),
		shortcut: text('shortcut'),
		subtype: text('subtype'),

		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		isArchived: integer('isArchived', { mode: 'boolean' }).notNull().default(false),
		totalImages: integer('totalImages').notNull().default(0),
		totalVideos: integer('totalVideos').notNull().default(0),
		type: text('type'),
		rarity: text('rarity'),
		value: text('value'),
		weight: text('weight'),
		size: text('size'),
		material: text('material'),
		materials: text('materials'),
		crafting: text('crafting'),
		requirements: text('requirements'),
		effects: text('effects'),
		origin: text('origin'),
		properties: text('properties'),
		uses: text('uses'),
		history: text('history'),
		notes: text('notes'),
		lore: text('lore'),
		sortBy: text('sortBy'),
		filters: text('filters'),
		featuredImage: text('featuredImage'),
		parentId: text('parentId'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('WorldItem_name_key').on(table.name),
	})
);

// Modelo para los conceptos
export const concepts = sqliteTable(
	'Concept',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		emoji: text('emoji').default('💡'),
		color: text('color').default('#3b82f6'),
		category: text('category'),

		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		totalImages: integer('totalImages').notNull().default(0),
		totalVideos: integer('totalVideos').notNull().default(0),
		type: text('type'),
		complexity: text('complexity'),
		applications: text('applications'),
		examples: text('examples'),
		relatedConcepts: text('relatedConcepts'),
		notes: text('notes'),
		featuredImage: text('featuredImage'),
		parentId: text('parentId'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('Concept_name_key').on(table.name),
	})
);

// Modelo para los prompts
export const prompts = sqliteTable(
	'Prompt',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		emoji: text('emoji').default('🔮'),
		color: text('color').default('#3b82f6'),
		category: text('category'),

		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		totalImages: integer('totalImages').notNull().default(0),
		totalVideos: integer('totalVideos').notNull().default(0),
		type: text('type'),
		content: text('content'),
		parameters: text('parameters'),
		style: text('style'),
		mood: text('mood'),
		lighting: text('lighting'),
		composition: text('composition'),
		technique: text('technique'),
		inspiration: text('inspiration'),
		notes: text('notes'),
		featuredImage: text('featuredImage'),
		parentId: text('parentId'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('Prompt_name_key').on(table.name),
	})
);

// Modelo para las notas - CORREGIDO según estructura real de BD
export const notes = sqliteTable(
	'Note',
	{
		id: text('id').primaryKey(),
		title: text('title').notNull(), // Campo real en BD
		content: text('content').notNull().default(''),
		category: text('category').notNull().default('general'),
		priority: integer('priority').notNull().default(0), // INTEGER en BD real
		status: text('status').notNull().default('active'),
		featuredImage: text('featuredImage'),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
		presetId: text('presetId'), // Campo real en BD
	},
	(table) => ({
		titleIdx: uniqueIndex('Note_title_key').on(table.title),
	})
);
