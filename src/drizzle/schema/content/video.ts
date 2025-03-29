import { index, integer, primaryKey, relations, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { baseFields, contentFields, visualFields } from '../base/common';
import { folders } from './folder';

export const videos = sqliteTable(
    'Video',
    {
        ...baseFields,
        ...contentFields,
        ...visualFields,
        path: text('path').notNull().unique(),
        hash: text('hash').notNull(),
        size: integer('size').notNull(),
        duration: integer('duration').notNull(),
        width: integer('width'),
        height: integer('height'),
        metadata: text('metadata'),
        thumbnail: text('thumbnail'),
        thumbnailSize: integer('thumbnailSize'),
        thumbnailWidth: integer('thumbnailWidth'),
        thumbnailHeight: integer('thumbnailHeight'),
        isPublic: integer('isPublic', { mode: 'boolean' }).notNull().default(false),
        folderId: text('folderId').notNull().references(() => folders.id, { onDelete: 'cascade' }),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.id] }),
        pathIdx: index('video_path_idx').on(table.path),
        hashIdx: index('video_hash_idx').on(table.hash),
        createdAtIdx: index('video_created_at_idx').on(table.createdAt),
        updatedAtIdx: index('video_updated_at_idx').on(table.updatedAt),
        isPublicIdx: index('video_is_public_idx').on(table.isPublic),
        isFavoriteIdx: index('video_is_favorite_idx').on(table.isFavorite),
    })
);

export const videosRelations = relations(videos, ({ one }) => ({
    folder: one(folders, {
        fields: [videos.folderId],
        references: [folders.id],
    }),
}));