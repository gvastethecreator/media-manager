import { integer, text } from 'drizzle-orm/sqlite-core';

/**
 * Campos base que comparten todas las tablas
 */
export const baseFields = {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    createdAt: integer('createdAt', { mode: 'timestamp_ms' })
        .notNull()
        .default(() => new Date().getTime()),
    updatedAt: integer('updatedAt', { mode: 'timestamp_ms' })
        .notNull()
        .default(() => new Date().getTime()),
};

/**
 * Campos de presentación comunes
 */
export const presentationFields = {
    emoji: text('emoji'),
    color: text('color').default('#3b82f6'),
};

/**
 * Campos de contenido comunes
 */
export const contentFields = {
    name: text('name').notNull(),
    description: text('description'),
};

/**
 * Campos visuales comunes
 */
export const visualFields = {
    featuredImage: text('featuredImage'),
    isFavorite: integer('isFavorite', { mode: 'boolean' }).notNull().default(false),
};

/**
 * Campos de organización comunes
 */
export const organizationFields = {
    ...baseFields,
    ...contentFields,
    ...presentationFields,
    ...visualFields,
    shortcut: text('shortcut'),
    category: text('category').default('general'),
    sortBy: text('sortBy').default('name'),
    filters: text('filters').default('empty_array'),
};