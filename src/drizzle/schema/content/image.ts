import { index, integer, primaryKey, relations, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { baseFields, contentFields, visualFields } from '../base/common';
import { folders } from './folder';

export const images = sqliteTable(
    'Image',
    {
        ...baseFields,
        ...contentFields,
        ...visualFields,
        path: text('path').notNull().unique(),
        hash: text('hash').notNull(),
        size: integer('size').notNull(),
        width: integer('width').notNull(),
        height: integer('height').notNull(),
        metadata: text('metadata'),
        thumbnail: text('thumbnail'),
        thumbnailSize: integer('thumbnailSize'),
        thumbnailWidth: integer('thumbnailWidth'),
        thumbnailHeight: integer('thumbnailHeight'),
        thumbnailError: text('thumbnailError'),
        thumbnailErrorAt: integer('thumbnailErrorAt', { mode: 'timestamp_ms' }),
        thumbnailOptimizedAt: integer('thumbnailOptimizedAt', { mode: 'timestamp_ms' }),
        folderId: text('folderId').notNull().references(() => folders.id, { onDelete: 'cascade' }),
        noteId: text('noteId'),
        addedAt: integer('addedAt', { mode: 'timestamp_ms' }).notNull().default(() => new Date().getTime()),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.id] }),
        pathFolderIdx: index('image_path_folder_idx').on(table.path, table.folderId),
        hashIdx: index('image_hash_idx').on(table.hash),
        createdAtIdx: index('image_created_at_idx').on(table.createdAt),
        updatedAtIdx: index('image_updated_at_idx').on(table.updatedAt),
        isFavoriteIdx: index('image_is_favorite_idx').on(table.isFavorite),
    })
);

export const imageStats = sqliteTable('ImageStats', {
    ...baseFields,
    views: integer('views').notNull().default(0),
    lastViewed: integer('lastViewed', { mode: 'timestamp_ms' }).notNull().default(() => new Date().getTime()),
    imageId: text('imageId').notNull().references(() => images.id).unique(),
});

export const uploadedImages = sqliteTable('UploadedImage', {
    ...baseFields,
    ...contentFields,
    path: text('path').notNull().unique(),
    category: text('category').default('system'),
    size: integer('size').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    metadata: text('metadata'),
    hash: text('hash').notNull(),
    imageId: text('imageId').notNull().references(() => images.id, { onDelete: 'cascade' }),
    uploadedAt: integer('uploadedAt', { mode: 'timestamp_ms' }).notNull().default(() => new Date().getTime()),
});

// Relaciones para imágenes
export const imagesRelations = relations(images, ({ one }) => ({
    folder: one(folders, {
        fields: [images.folderId],
        references: [folders.id],
    }),
    stats: one(imageStats, {
        fields: [images.id],
        references: [imageStats.imageId],
    }),
}));

export const imageStatsRelations = relations(imageStats, ({ one }) => ({
    image: one(images, {
        fields: [imageStats.imageId],
        references: [images.id],
    }),
}));

export const uploadedImagesRelations = relations(uploadedImages, ({ one }) => ({
    image: one(images, {
        fields: [uploadedImages.imageId],
        references: [images.id],
    }),
}));