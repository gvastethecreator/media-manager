import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/**
 * =================================================================================
 * TABLAS DE LA BASE DE DATOS (Sintaxis Drizzle)
 * =================================================================================
 * Este archivo contiene la definición del schema de la base de datos usando Drizzle ORM.
 * Ha sido traducido manualmente desde 'prisma/schema.prisma' debido a problemas con la
 * introspección automática de Drizzle Kit.
 *
 * Proceso:
 * 1. Definición de todas las tablas con sus columnas y tipos de datos.
 * 2. Definición de las relaciones entre las tablas en un objeto 'relations' separado.
 *
 * Mantener este archivo sincronizado con cualquier cambio futuro en la lógica de datos.
 * =================================================================================
 */

// =================================================================================
// IMPORTACIONES DEL SISTEMA MODULAR
// =================================================================================
// Importar y re-exportar todas las tablas del sistema modular
export * from './schema/index';

// Modelo para el sistema de colas
export const queueJobs = sqliteTable(
	'QueueJob',
	{
		id: text('id').primaryKey(),
		queue: text('queue').notNull(),
		data: text('data').notNull(),
		status: text('status').notNull().default('pending'),
		attempts: integer('attempts').notNull().default(0),
		maxAttempts: integer('maxAttempts').notNull().default(3),
		error: text('error'),
		progress: integer('progress').notNull().default(0),
		startedAt: integer('startedAt', { mode: 'timestamp_ms' }),
		finishedAt: integer('finishedAt', { mode: 'timestamp_ms' }),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
		priority: integer('priority').notNull().default(0),
		metadata: text('metadata'),
		retryAt: integer('retryAt', { mode: 'timestamp_ms' }),
	},
	(table) => ({
		queueStatusIdx: index('QueueJob_queue_status_idx').on(table.queue, table.status),
		statusCreatedIdx: index('QueueJob_status_createdAt_idx').on(table.status, table.createdAt),
		priorityStatusCreatedIdx: index('QueueJob_priority_status_createdAt_idx').on(
			table.priority,
			table.status,
			table.createdAt
		),
		retryAtIdx: index('QueueJob_retryAt_idx').on(table.retryAt),
	})
);

// Modelo para el perfil de usuario
export const profiles = sqliteTable('Profile', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	emoji: text('emoji').notNull().default('👤'),
	color: text('color').notNull().default('#3b82f6'),
	description: text('description'),
	isActive: integer('isActive', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	settingsId: text('settingsId'),
	imageId: text('imageId'),
});

// Settings para el sistema
export const settings = sqliteTable(
	'Settings',
	{
		id: text('id').primaryKey(),
		theme: text('theme').notNull().default('system'),
		language: text('language').notNull().default('es'),
		data: text('data').notNull(), // Prisma's Json maps to TEXT in SQLite
		profileId: text('profileId').notNull(),
	},
	(table) => ({
		profileIdIdx: uniqueIndex('Settings_profileId_key').on(table.profileId),
	})
);

// Modelo para las carpetas
export const folders = sqliteTable(
	'Folder',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		path: text('path').notNull(),
		emoji: text('emoji').default('📁'),
		color: text('color').default('#3b82f6'),
		featuredImage: text('featuredImage'),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		totalFiles: integer('totalFiles').notNull().default(0),
		totalSize: integer('totalSize').notNull().default(0),
		autoReindex: integer('autoReindex', { mode: 'boolean' }).notNull().default(false),
		lastIndexed: integer('lastIndexed', { mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
		parentId: text('parentId'),
		presetId: text('presetId'),
	},
	(table) => ({
		pathIdx: uniqueIndex('Folder_path_key').on(table.path),
		path_idx: index('Folder_path_idx').on(table.path),
		lastIndexed_idx: index('Folder_lastIndexed_idx').on(table.lastIndexed),
		createdAt_idx: index('Folder_createdAt_idx').on(table.createdAt),
	})
);

// Modelo para las imágenes
export const images = sqliteTable(
	'Image',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		path: text('path').notNull(),
		hash: text('hash').notNull(),
		size: integer('size').notNull(),
		width: integer('width').notNull(),
		height: integer('height').notNull(),
		metadata: text('metadata'),
		thumbnail: text('thumbnail'), // Using TEXT for base64 encoded thumbnail
		thumbnailSize: integer('thumbnailSize'),
		thumbnailWidth: integer('thumbnailWidth'),
		thumbnailHeight: integer('thumbnailHeight'),
		thumbnailMimeType: text('thumbnailMimeType'),
		thumbnailError: text('thumbnailError'),
		thumbnailErrorAt: integer('thumbnailErrorAt', { mode: 'timestamp_ms' }),
		thumbnailOptimizedAt: integer('thumbnailOptimizedAt', {
			mode: 'timestamp_ms',
		}),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		folderId: text('folderId').notNull(),
		noteId: text('noteId'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
		addedAt: integer('addedAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => ({
		pathFolderIdIdx: uniqueIndex('Image_path_folderId_key').on(table.path, table.folderId),
		folderId_idx: index('Image_folderId_idx').on(table.folderId),
		hash_idx: index('Image_hash_idx').on(table.hash),
		createdAt_idx: index('Image_createdAt_idx').on(table.createdAt),
		updatedAt_idx: index('Image_updatedAt_idx').on(table.updatedAt),
		isFavorite_idx: index('Image_isFavorite_idx').on(table.isFavorite),
	})
);

// Modelo para los videos
export const videos = sqliteTable(
	'Video',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		path: text('path').notNull(),
		hash: text('hash').notNull(),
		size: integer('size').notNull(),
		duration: integer('duration').notNull(),
		width: integer('width'),
		height: integer('height'),
		metadata: text('metadata'),
		thumbnail: text('thumbnail'), // Using TEXT for base64 encoded thumbnail
		thumbnailSize: integer('thumbnailSize'),
		thumbnailWidth: integer('thumbnailWidth'),
		thumbnailHeight: integer('thumbnailHeight'),
		isPublic: integer('isPublic', { mode: 'boolean' }).notNull().default(false),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		isHidden: integer('isHidden', { mode: 'boolean' }).notNull().default(false),
		folderId: text('folderId').notNull(),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		pathIdx: uniqueIndex('Video_path_key').on(table.path),
		folderId_idx: index('Video_folderId_idx').on(table.folderId),
		hash_idx: index('Video_hash_idx').on(table.hash),
		createdAt_idx: index('Video_createdAt_idx').on(table.createdAt),
		updatedAt_idx: index('Video_updatedAt_idx').on(table.updatedAt),
	})
);

// Modelo para las imágenes subidas
export const uploadedImages = sqliteTable(
	'UploadedImage',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		path: text('path').notNull(),
		size: integer('size').notNull(),
		hash: text('hash').notNull(),
		metadata: text('metadata'),
		imageId: text('imageId').notNull(),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
	},
	(table) => ({
		pathIdx: uniqueIndex('UploadedImage_path_key').on(table.path),
		imageId_idx: index('UploadedImage_imageId_idx').on(table.imageId),
		hash_idx: index('UploadedImage_hash_idx').on(table.hash),
	})
);

// Modelo para las estadísticas de imágenes
export const imageStats = sqliteTable(
	'ImageStats',
	{
		id: text('id').primaryKey(),
		imageId: text('imageId').notNull(),
		views: integer('views').notNull().default(0),
		downloads: integer('downloads').notNull().default(0),
		likes: integer('likes').notNull().default(0),
		comments: integer('comments').notNull().default(0),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		imageIdIdx: uniqueIndex('ImageStats_imageId_key').on(table.imageId),
	})
);

// Modelo para la actividad
export const activities = sqliteTable('Activity', {
	id: text('id').primaryKey(),
	type: text('type').notNull(),
	entityType: text('entityType').notNull(),
	entityId: text('entityId').notNull(),
	userId: text('userId'),
	action: text('action').notNull(),
	description: text('description'),
	metadata: text('metadata'),
	ipAddress: text('ipAddress'),
	userAgent: text('userAgent'),
	sessionId: text('sessionId'),
	createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

// Índices para la tabla Activity
export const activityIndexes = {
	typeIdx: index('Activity_type_idx').on(activities.type),
	entityTypeIdx: index('Activity_entityType_idx').on(activities.entityType),
	entityIdIdx: index('Activity_entityId_idx').on(activities.entityId),
	createdAtIdx: index('Activity_createdAt_idx').on(activities.createdAt),
};

// Modelo para los grupos
export const groups = sqliteTable(
	'Group',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('Group_name_key').on(table.name),
	})
);

// Modelo para los álbumes
export const albums = sqliteTable(
	'Album',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		emoji: text('emoji').default('📔'),
		color: text('color').default('#3b82f6'),
		featuredImage: text('featuredImage'),
		isPublic: integer('isPublic', { mode: 'boolean' }).notNull().default(false),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		totalImages: integer('totalImages').notNull().default(0),
		totalVideos: integer('totalVideos').notNull().default(0),
		totalSize: integer('totalSize').notNull().default(0),
		filters: text('filters'),
		shortcut: text('shortcut'),
		category: text('category'),
		metadata: text('metadata'),
		lastImageAddedAt: integer('lastImageAddedAt', { mode: 'timestamp_ms' }),
		lastVideoAddedAt: integer('lastVideoAddedAt', { mode: 'timestamp_ms' }),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('Album_name_key').on(table.name),
	})
);

// Modelo para las colecciones
export const collections = sqliteTable(
	'Collection',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		emoji: text('emoji').default('📚'),
		color: text('color').default('#3b82f6'),
		featuredImage: text('featuredImage'),
		isPublic: integer('isPublic', { mode: 'boolean' }).notNull().default(false),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		totalImages: integer('totalImages').notNull().default(0),
		totalVideos: integer('totalVideos').notNull().default(0),
		totalSize: integer('totalSize').notNull().default(0),
		lastImageAddedAt: integer('lastImageAddedAt', { mode: 'timestamp_ms' }),
		lastVideoAddedAt: integer('lastVideoAddedAt', { mode: 'timestamp_ms' }),
		parentId: text('parentId'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('Collection_name_key').on(table.name),
	})
);

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
		isPublic: integer('isPublic', { mode: 'boolean' }).notNull().default(false),
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
		isPublic: integer('isPublic', { mode: 'boolean' }).notNull().default(false),
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
		isPublic: integer('isPublic', { mode: 'boolean' }).notNull().default(false),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		totalImages: integer('totalImages').notNull().default(0),
		totalVideos: integer('totalVideos').notNull().default(0),
		type: text('type'),
		rarity: text('rarity'),
		value: text('value'),
		weight: text('weight'),
		materials: text('materials'),
		origin: text('origin'),
		properties: text('properties'),
		uses: text('uses'),
		history: text('history'),
		notes: text('notes'),
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
		isPublic: integer('isPublic', { mode: 'boolean' }).notNull().default(false),
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
		isPublic: integer('isPublic', { mode: 'boolean' }).notNull().default(false),
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

// Modelo para archivos de audio
export const audios = sqliteTable(
	'Audio',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		path: text('path').notNull(),
		size: integer('size').notNull(),
		hash: text('hash').notNull(),
		mimeType: text('mimeType').notNull(),
		extension: text('extension').notNull(),
		folderId: text('folderId').notNull(),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		isArchived: integer('isArchived', { mode: 'boolean' }).notNull().default(false),
		duration: integer('duration'),
		bitrate: integer('bitrate'),
		sampleRate: integer('sampleRate'),
		channels: integer('channels'),
		format: text('format'),
		codec: text('codec'),
		title: text('title'),
		artist: text('artist'),
		album: text('album'),
		year: integer('year'),
		genre: text('genre'),
		track: integer('track'),
		disc: integer('disc'),
		albumArtist: text('albumArtist'),
		composer: text('composer'),
		comment: text('comment'),
		lyrics: text('lyrics'),
		bpm: integer('bpm'),
		key: text('key'),
		mood: text('mood'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		pathIdx: uniqueIndex('Audio_path_key').on(table.path),
		folderId_idx: index('Audio_folderId_idx').on(table.folderId),
		hash_idx: index('Audio_hash_idx').on(table.hash),
		createdAt_idx: index('Audio_createdAt_idx').on(table.createdAt),
		updatedAt_idx: index('Audio_updatedAt_idx').on(table.updatedAt),
	})
);

// Modelo para documentos
export const documents = sqliteTable(
	'Document',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		path: text('path').notNull(),
		size: integer('size').notNull(),
		hash: text('hash').notNull(),
		mimeType: text('mimeType').notNull(),
		extension: text('extension').notNull(),
		folderId: text('folderId').notNull(),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		isArchived: integer('isArchived', { mode: 'boolean' }).notNull().default(false),
		pageCount: integer('pageCount'),
		wordCount: integer('wordCount'),
		language: text('language'),
		title: text('title'),
		author: text('author'),
		subject: text('subject'),
		keywords: text('keywords'),
		creator: text('creator'),
		producer: text('producer'),
		creationDate: integer('creationDate', { mode: 'timestamp_ms' }),
		modificationDate: integer('modificationDate', { mode: 'timestamp_ms' }),
		encrypted: integer('encrypted', { mode: 'boolean' }).default(false),
		version: text('version'),
		content: text('content'),
		summary: text('summary'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		pathIdx: uniqueIndex('Document_path_key').on(table.path),
		folderId_idx: index('Document_folderId_idx').on(table.folderId),
		hash_idx: index('Document_hash_idx').on(table.hash),
		createdAt_idx: index('Document_createdAt_idx').on(table.createdAt),
		updatedAt_idx: index('Document_updatedAt_idx').on(table.updatedAt),
	})
);

// Modelo para archivos JSON
export const jsonFiles = sqliteTable(
	'JsonFile',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		path: text('path').notNull(),
		size: integer('size').notNull(),
		hash: text('hash').notNull(),
		mimeType: text('mimeType').notNull(),
		extension: text('extension').notNull(),
		folderId: text('folderId').notNull(),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		isArchived: integer('isArchived', { mode: 'boolean' }).notNull().default(false),
		content: text('content'),
		schema: text('schema'),
		isValid: integer('isValid', { mode: 'boolean' }).default(true),
		validationErrors: text('validationErrors'),
		keyCount: integer('keyCount'),
		depth: integer('depth'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		pathIdx: uniqueIndex('JsonFile_path_key').on(table.path),
		folderId_idx: index('JsonFile_folderId_idx').on(table.folderId),
		hash_idx: index('JsonFile_hash_idx').on(table.hash),
		createdAt_idx: index('JsonFile_createdAt_idx').on(table.createdAt),
		updatedAt_idx: index('JsonFile_updatedAt_idx').on(table.updatedAt),
	})
);

// Modelo para archivos 3D
export const file3Ds = sqliteTable(
	'File3D',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		path: text('path').notNull(),
		size: integer('size').notNull(),
		hash: text('hash').notNull(),
		mimeType: text('mimeType').notNull(),
		extension: text('extension').notNull(),
		folderId: text('folderId').notNull(),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		isArchived: integer('isArchived', { mode: 'boolean' }).notNull().default(false),
		format: text('format'),
		version: text('version'),
		vertices: integer('vertices'),
		faces: integer('faces'),
		triangles: integer('triangles'),
		materials: integer('materials'),
		textures: integer('textures'),
		animations: integer('animations'),
		bones: integer('bones'),
		scenes: integer('scenes'),
		cameras: integer('cameras'),
		lights: integer('lights'),
		hasUV: integer('hasUV', { mode: 'boolean' }).default(false),
		hasNormals: integer('hasNormals', { mode: 'boolean' }).default(false),
		hasColors: integer('hasColors', { mode: 'boolean' }).default(false),
		boundingBox: text('boundingBox'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		pathIdx: uniqueIndex('File3D_path_key').on(table.path),
		folderId_idx: index('File3D_folderId_idx').on(table.folderId),
		hash_idx: index('File3D_hash_idx').on(table.hash),
		createdAt_idx: index('File3D_createdAt_idx').on(table.createdAt),
		updatedAt_idx: index('File3D_updatedAt_idx').on(table.updatedAt),
	})
);

// Modelo para metadatos
export const metadatas = sqliteTable(
	'Metadata',
	{
		id: text('id').primaryKey(),
		entityType: text('entityType').notNull(),
		entityId: text('entityId').notNull(),
		key: text('key').notNull(),
		value: text('value'),
		type: text('type').default('string'),
		isPublic: integer('isPublic', { mode: 'boolean' }).notNull().default(false),
		category: text('category'),
		description: text('description'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		entityTypeEntityIdIdx: index('Metadata_entityType_entityId_idx').on(table.entityType, table.entityId),
		keyIdx: index('Metadata_key_idx').on(table.key),
	})
);

// Modelo para miniaturas
export const thumbnails = sqliteTable(
	'Thumbnail',
	{
		id: text('id').primaryKey(),
		entityType: text('entityType').notNull(),
		entityId: text('entityId').notNull(),
		size: text('size').notNull(),
		path: text('path').notNull(),
		width: integer('width').notNull(),
		height: integer('height').notNull(),
		format: text('format').notNull(),
		quality: integer('quality').default(80),
		fileSize: integer('fileSize').notNull(),
		isGenerated: integer('isGenerated', { mode: 'boolean' }).notNull().default(true),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		entityTypeEntityIdSizeIdx: uniqueIndex('Thumbnail_entityType_entityId_size_key').on(
			table.entityType,
			table.entityId,
			table.size
		),
		pathIdx: uniqueIndex('Thumbnail_path_key').on(table.path),
	})
);

// Nota: workflows se exporta desde schema/content/index.ts

// Modelo para favoritos
export const favorites = sqliteTable(
	'Favorite',
	{
		id: text('id').primaryKey(),
		entityType: text('entityType').notNull(), // 'image', 'video', 'album', etc.
		entityId: text('entityId').notNull(),
		userId: text('userId'), // Opcional por ahora
		addedAt: integer('addedAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		notes: text('notes'), // Notas opcionales del usuario sobre por qué es favorito
		category: text('category'), // Categoría personalizada de favorito
		priority: integer('priority').default(0), // Prioridad del favorito (0-10)
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		entityTypeEntityIdIdx: uniqueIndex('Favorite_entityType_entityId_key').on(table.entityType, table.entityId),
		entityTypeIdx: index('Favorite_entityType_idx').on(table.entityType),
		userIdIdx: index('Favorite_userId_idx').on(table.userId),
		addedAtIdx: index('Favorite_addedAt_idx').on(table.addedAt),
		categoryIdx: index('Favorite_category_idx').on(table.category),
		priorityIdx: index('Favorite_priority_idx').on(table.priority),
	})
);

// Modelo para archivos genéricos
export const files = sqliteTable(
	'File',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		path: text('path').notNull(),
		size: integer('size').notNull(),
		hash: text('hash').notNull(),
		mimeType: text('mimeType').notNull(),
		extension: text('extension').notNull(),
		fileType: text('fileType').notNull(), // 'image', 'video', 'audio', 'document', etc.
		folderId: text('folderId').notNull(),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		isArchived: integer('isArchived', { mode: 'boolean' }).notNull().default(false),
		isHidden: integer('isHidden', { mode: 'boolean' }).notNull().default(false),
		description: text('description'),
		tags: text('tags'), // JSON array de tags
		metadata: text('metadata'), // JSON con metadatos específicos del tipo
		lastAccessed: integer('lastAccessed', { mode: 'timestamp_ms' }),
		accessCount: integer('accessCount').default(0),
		isProcessed: integer('isProcessed', { mode: 'boolean' }).default(false),
		processingError: text('processingError'),
		processingStatus: text('processingStatus').default('pending'), // 'pending', 'processing', 'completed', 'failed'
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		pathIdx: uniqueIndex('File_path_key').on(table.path),
		folderId_idx: index('File_folderId_idx').on(table.folderId),
		hash_idx: index('File_hash_idx').on(table.hash),
		fileType_idx: index('File_fileType_idx').on(table.fileType),
		createdAt_idx: index('File_createdAt_idx').on(table.createdAt),
		updatedAt_idx: index('File_updatedAt_idx').on(table.updatedAt),
		isFavorite_idx: index('File_isFavorite_idx').on(table.isFavorite),
		processingStatus_idx: index('File_processingStatus_idx').on(table.processingStatus),
	})
);

// =================================================================================
// TABLAS DE RELACIONES MANY-TO-MANY
// =================================================================================

// Relación Image-Album
export const imageAlbums = sqliteTable(
	'_ImageToAlbum',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // albumId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToAlbum_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToAlbum_B_index').on(table.B),
	})
);

// Relación Video-Album
export const videoAlbums = sqliteTable(
	'_VideoToAlbum',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // albumId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToAlbum_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToAlbum_B_index').on(table.B),
	})
);

// Relación Image-Collection
export const imageCollections = sqliteTable(
	'_ImageToCollection',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // collectionId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToCollection_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToCollection_B_index').on(table.B),
	})
);

// Relación Video-Collection
export const videoCollections = sqliteTable(
	'_VideoToCollection',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // collectionId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToCollection_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToCollection_B_index').on(table.B),
	})
);

// Relación Image-Tag
export const imageTags = sqliteTable(
	'_ImageToTag',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // tagId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToTag_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToTag_B_index').on(table.B),
	})
);

// Relación Video-Tag
export const videoTags = sqliteTable(
	'_VideoToTag',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // tagId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToTag_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToTag_B_index').on(table.B),
	})
);

// Relación Image-Property
export const imageProperties = sqliteTable(
	'_ImageToProperty',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // propertyId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToProperty_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToProperty_B_index').on(table.B),
	})
);

// Relación Video-Property
export const videoProperties = sqliteTable(
	'_VideoToProperty',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // propertyId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToProperty_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToProperty_B_index').on(table.B),
	})
);

// Relación Image-Wildcard
export const imageWildcards = sqliteTable(
	'_ImageToWildcard',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // wildcardId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToWildcard_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToWildcard_B_index').on(table.B),
	})
);

// Relación Video-Wildcard
export const videoWildcards = sqliteTable(
	'_VideoToWildcard',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // wildcardId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToWildcard_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToWildcard_B_index').on(table.B),
	})
);

// Relación Image-Character
export const imageCharacters = sqliteTable(
	'_ImageToCharacter',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // characterId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToCharacter_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToCharacter_B_index').on(table.B),
	})
);

// Relación Video-Character
export const videoCharacters = sqliteTable(
	'_VideoToCharacter',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // characterId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToCharacter_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToCharacter_B_index').on(table.B),
	})
);

// Relación Image-Place
export const imagePlaces = sqliteTable(
	'_ImageToPlace',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // placeId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToPlace_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToPlace_B_index').on(table.B),
	})
);

// Relación Video-Place
export const videoPlaces = sqliteTable(
	'_VideoToPlace',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // placeId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToPlace_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToPlace_B_index').on(table.B),
	})
);

// Relación Image-WorldItem
export const imageWorldItems = sqliteTable(
	'_ImageToWorldItem',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // worldItemId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToWorldItem_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToWorldItem_B_index').on(table.B),
	})
);

// Relación Video-WorldItem
export const videoWorldItems = sqliteTable(
	'_VideoToWorldItem',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // worldItemId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToWorldItem_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToWorldItem_B_index').on(table.B),
	})
);

// Relación Image-Concept
export const imageConcepts = sqliteTable(
	'_ImageToConcept',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // conceptId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToConcept_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToConcept_B_index').on(table.B),
	})
);

// Relación Video-Concept
export const videoConcepts = sqliteTable(
	'_VideoToConcept',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // conceptId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToConcept_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToConcept_B_index').on(table.B),
	})
);

// Relación Image-Prompt
export const imagePrompts = sqliteTable(
	'_ImageToPrompt',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // promptId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToPrompt_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToPrompt_B_index').on(table.B),
	})
);

// Relación Video-Prompt
export const videoPrompts = sqliteTable(
	'_VideoToPrompt',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // promptId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToPrompt_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToPrompt_B_index').on(table.B),
	})
);

// Relación Image-Note
export const imageNotes = sqliteTable(
	'_ImageToNote',
	{
		A: text('A').notNull(), // imageId
		B: text('B').notNull(), // noteId
	},
	(table) => ({
		AB_unique: uniqueIndex('_ImageToNote_AB_unique').on(table.A, table.B),
		B_index: index('_ImageToNote_B_index').on(table.B),
	})
);

// Relación Video-Note
export const videoNotes = sqliteTable(
	'_VideoToNote',
	{
		A: text('A').notNull(), // videoId
		B: text('B').notNull(), // noteId
	},
	(table) => ({
		AB_unique: uniqueIndex('_VideoToNote_AB_unique').on(table.A, table.B),
		B_index: index('_VideoToNote_B_index').on(table.B),
	})
);
