import { relations } from 'drizzle-orm';
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Tabla para el sistema de colas
export const queueJobs = sqliteTable(
	'QueueJob',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		queue: text('queue').notNull(),
		data: text('data').notNull(),
		status: text('status').notNull().default('pending'),
		attempts: integer('attempts').notNull().default(0),
		maxAttempts: integer('maxAttempts').notNull().default(3),
		error: text('error'),
		progress: integer('progress').notNull().default(0),
		startedAt: integer('startedAt', { mode: 'timestamp_ms' }),
		finishedAt: integer('finishedAt', { mode: 'timestamp_ms' }),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(() => new Date().getTime()),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(() => new Date().getTime()),
		priority: integer('priority').notNull().default(0),
		metadata: text('metadata'),
		retryAt: integer('retryAt', { mode: 'timestamp_ms' }),
	},
	(table) => {
		return {
			queueStatusIdx: primaryKey({ columns: [table.queue, table.status] }),
			statusCreatedAtIdx: primaryKey({ columns: [table.status, table.createdAt] }),
			priorityStatusCreatedAtIdx: primaryKey({ columns: [table.priority, table.status, table.createdAt] }),
			retryAtIdx: primaryKey({ columns: [table.retryAt] }),
		};
	}
);

// Tabla para el perfil de usuario
export const profiles = sqliteTable('Profile', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	emoji: text('emoji').notNull().default('👤'),
	color: text('color').notNull().default('#3b82f6'),
	theme: text('theme').notNull().default('system'),
	language: text('language').notNull().default('es'),
	description: text('description'),
	isActive: integer('isActive', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('createdAt', { mode: 'timestamp_ms' })
		.notNull()
		.default(() => new Date().getTime()),
	updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
		.notNull()
		.default(() => new Date().getTime()),
});

// Tabla para la configuración visual de carpetas
export const folderVisualConfigs = sqliteTable('FolderVisualConfig', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	enable3DEffect: integer('enable3DEffect', { mode: 'boolean' }).notNull().default(true),
	designSystem: text('designSystem').default('default_design_system'),
	enableHolographicEffect: integer('enableHolographicEffect', { mode: 'boolean' }).notNull().default(true),
	enableGlowEffect: integer('enableGlowEffect', { mode: 'boolean' }).notNull().default(true),
	enableAnimatedBorder: integer('enableAnimatedBorder', { mode: 'boolean' }).notNull().default(true),
	enableLightHalo: integer('enableLightHalo', { mode: 'boolean' }).notNull().default(true),
	layerSystem: text('layerSystem').default('default_layer_system'),
	effects: text('effects').default('default_effects'),
	performance: text('performance').default('default_performance'),
	states: text('states').default('default_states'),
	createdAt: integer('createdAt', { mode: 'timestamp_ms' })
		.notNull()
		.default(() => new Date().getTime()),
	updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
		.notNull()
		.default(() => new Date().getTime()),
});

// Tabla para las carpetas
export const folders = sqliteTable(
	'Folder',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		name: text('name').notNull(),
		description: text('description'),
		path: text('path').notNull().unique(),
		parentId: text('parentId').references(() => folders.id, { onDelete: 'cascade' }),
		visualConfigId: text('visualConfigId')
			.references(() => folderVisualConfigs.id)
			.unique(),
		totalFiles: integer('totalFiles').notNull().default(0),
		totalSize: integer('totalSize').notNull().default(0),
		lastIndexed: integer('lastIndexed', { mode: 'timestamp_ms' }).default(() => new Date().getTime()),
		autoReindex: integer('autoReindex', { mode: 'boolean' }).notNull().default(false),
		featuredImage: text('featuredImage'),
		isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
		emoji: text('emoji').default('📁'),
		color: text('color').default('#3b82f6'),
		presetId: text('presetId'),
		createdAt: integer('createdAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(() => new Date().getTime()),
		updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
			.notNull()
			.default(() => new Date().getTime()),
	},
	(table) => {
		return {
			pathIdx: primaryKey({ columns: [table.path] }),
			lastIndexedIdx: primaryKey({ columns: [table.lastIndexed] }),
			createdAtIdx: primaryKey({ columns: [table.createdAt] }),
		};
	}
);

// Relaciones
export const foldersRelations = relations(folders, ({ one, many }) => ({
	parent: one(folders, {
		fields: [folders.parentId],
		references: [folders.id],
	}),
	children: many(folders),
	visualConfig: one(folderVisualConfigs, {
		fields: [folders.visualConfigId],
		references: [folderVisualConfigs.id],
	}),
}));

export const folderVisualConfigsRelations = relations(folderVisualConfigs, ({ one }) => ({
	folder: one(folders, {
		fields: [folderVisualConfigs.id],
		references: [folders.visualConfigId],
	}),
}));
