import { index, integer, primaryKey, relations, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { baseFields, contentFields, visualFields } from '../base/common';
import { createRelationTable } from '../base/relations';
import { albums } from '../organization/album';
import { collections } from '../organization/collection';
import { groups } from '../organization/group';
import { tags } from '../organization/tag';
import { concepts } from '../utility/concept';
import { notes } from '../utility/note';
import { prompts } from '../utility/prompt';
import { properties } from '../utility/property';
import { wildcards } from '../utility/wildcard';
import { characters } from '../world/character';
import { places } from '../world/place';
import { worldItems } from '../world/worldItem';
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

// Tablas de relación para imágenes
export const imagesToAlbums = createRelationTable('ImageToAlbum', 'Image', 'Album');
export const imagesToCollections = createRelationTable('ImageToCollection', 'Image', 'Collection');
export const imagesToTags = createRelationTable('ImageToTag', 'Image', 'Tag');
export const imagesToCharacters = createRelationTable('ImageToCharacter', 'Image', 'Character');
export const imagesToPlaces = createRelationTable('ImageToPlace', 'Image', 'Place');
export const imagesToWorldItems = createRelationTable('ImageToWorldItem', 'Image', 'WorldItem');
export const imagesToConcepts = createRelationTable('ImageToConcept', 'Image', 'Concept');
export const imagesToPrompts = createRelationTable('ImageToPrompt', 'Image', 'Prompt');
export const imagesToNotes = createRelationTable('ImageToNote', 'Image', 'Note');
export const imagesToWildcards = createRelationTable('ImageToWildcard', 'Image', 'Wildcard');
export const imagesToProperties = createRelationTable('ImageToProperty', 'Image', 'Property');
export const imagesToGroups = createRelationTable('ImageToGroup', 'Image', 'Group');

// Relaciones para imágenes
export const imagesRelations = relations(images, ({ one, many }) => ({
    folder: one(folders, {
        fields: [images.folderId],
        references: [folders.id],
    }),
    stats: one(imageStats, {
        fields: [images.id],
        references: [imageStats.imageId],
    }),
    albums: many(albums, { through: imagesToAlbums }),
    collections: many(collections, { through: imagesToCollections }),
    tags: many(tags, { through: imagesToTags }),
    characters: many(characters, { through: imagesToCharacters }),
    places: many(places, { through: imagesToPlaces }),
    worldItems: many(worldItems, { through: imagesToWorldItems }),
    concepts: many(concepts, { through: imagesToConcepts }),
    prompts: many(prompts, { through: imagesToPrompts }),
    notes: many(notes, { through: imagesToNotes }),
    wildcards: many(wildcards, { through: imagesToWildcards }),
    properties: many(properties, { through: imagesToProperties }),
    groups: many(groups, { through: imagesToGroups }),
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