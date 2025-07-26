/**
 * =================================================================================
 * CONTENT DOMAIN SCHEMA - DRIZZLE ORM
 * =================================================================================
 * Definiciones de tablas para el dominio Content del sistema
 *
 * Tablas incluidas:
 * - imageStats: Estadísticas de imágenes
 * - activities: Actividades del sistema
 * - audios: Archivos de audio
 * - documents: Documentos
 * - jsonFiles: Archivos JSON
 * - file3Ds: Archivos 3D
 * - metadatas: Metadatos genéricos
 * - thumbnails: Miniaturas
 * - workflows: Flujos de trabajo
 * =================================================================================
 */

import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// Modelo para estadísticas de imágenes
export const imageStats = sqliteTable(
	'ImageStats',
	{
		id: text('id').primaryKey(),
		imageId: text('imageId').notNull(),
		views: integer('views').notNull().default(0),
		likes: integer('likes').notNull().default(0),
		downloads: integer('downloads').notNull().default(0),
		comments: integer('comments').notNull().default(0),
		rating: integer('rating').default(0),
		ratingCount: integer('ratingCount').default(0),
		lastViewed: integer('lastViewed', { mode: 'timestamp_ms' }),
		lastLiked: integer('lastLiked', { mode: 'timestamp_ms' }),
		lastDownloaded: integer('lastDownloaded', { mode: 'timestamp_ms' }),
		lastCommented: integer('lastCommented', { mode: 'timestamp_ms' }),
		lastRated: integer('lastRated', { mode: 'timestamp_ms' }),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		imageIdIdx: uniqueIndex('ImageStats_imageId_key').on(table.imageId),
		viewsIdx: index('ImageStats_views_idx').on(table.views),
		likesIdx: index('ImageStats_likes_idx').on(table.likes),
		downloadsIdx: index('ImageStats_downloads_idx').on(table.downloads),
		ratingIdx: index('ImageStats_rating_idx').on(table.rating),
	})
);

// Modelo para las actividades
export const activities = sqliteTable(
	'Activity',
	{
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
	},
	(table) => ({
		typeIdx: index('Activity_type_idx').on(table.type),
		entityTypeIdx: index('Activity_entityType_idx').on(table.entityType),
		entityIdIdx: index('Activity_entityId_idx').on(table.entityId),
		userIdIdx: index('Activity_userId_idx').on(table.userId),
		actionIdx: index('Activity_action_idx').on(table.action),
		createdAtIdx: index('Activity_createdAt_idx').on(table.createdAt),
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
		// Propiedades adicionales requeridas por el servicio
		description: text('description'),
		emoji: text('emoji'),
		color: text('color'),
		shortcut: text('shortcut'),
		category: text('category'),
		filePath: text('filePath'),
		fileName: text('fileName'),
		fileSize: integer('fileSize'),
		tags: text('tags'),
		metadata: text('metadata'),
		sortBy: text('sortBy'),
		filters: text('filters'),
		featuredImage: text('featuredImage'),
		// Propiedades de análisis JSON
		validJson: integer('validJson', { mode: 'boolean' }).default(false),
		schemaVersion: text('schemaVersion'),
		keys: text('keys'),
		values: text('values'),
		hasArrays: integer('hasArrays', { mode: 'boolean' }).default(false),
		hasObjects: integer('hasObjects', { mode: 'boolean' }).default(false),
		encoding: text('encoding'),
		compressed: integer('compressed', { mode: 'boolean' }).default(false),
		minified: integer('minified', { mode: 'boolean' }).default(false),
		prettyPrinted: integer('prettyPrinted', { mode: 'boolean' }).default(false),
		parsedContent: text('parsedContent'),
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

// Modelo para flujos de trabajo
export const workflows = sqliteTable(
	'Workflow',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		emoji: text('emoji').default('⚙️'),
		color: text('color').default('#3b82f6'),
		category: text('category'),
		isPublic: integer('isPublic', { mode: 'boolean' }).notNull().default(false),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		isActive: integer('isActive', { mode: 'boolean' }).notNull().default(true),
		version: text('version').default('1.0.0'),
		config: text('config'),
		steps: text('steps'),
		triggers: text('triggers'),
		conditions: text('conditions'),
		actions: text('actions'),
		schedule: text('schedule'),
		lastRun: integer('lastRun', { mode: 'timestamp_ms' }),
		nextRun: integer('nextRun', { mode: 'timestamp_ms' }),
		runCount: integer('runCount').notNull().default(0),
		successCount: integer('successCount').notNull().default(0),
		errorCount: integer('errorCount').notNull().default(0),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' }).$onUpdate(() => new Date()),
	},
	(table) => ({
		nameIdx: uniqueIndex('Workflow_name_key').on(table.name),
	})
);
