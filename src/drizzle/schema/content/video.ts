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

// Tablas de relación para videos
export const videosToAlbums = createRelationTable('VideoToAlbum', 'Video', 'Album');
export const videosToCollections = createRelationTable('VideoToCollection', 'Video', 'Collection');
export const videosToTags = createRelationTable('VideoToTag', 'Video', 'Tag');
export const videosToCharacters = createRelationTable('VideoToCharacter', 'Video', 'Character');
export const videosToPlaces = createRelationTable('VideoToPlace', 'Video', 'Place');
export const videosToWorldItems = createRelationTable('VideoToWorldItem', 'Video', 'WorldItem');
export const videosToConcepts = createRelationTable('VideoToConcept', 'Video', 'Concept');
export const videosToPrompts = createRelationTable('VideoToPrompt', 'Video', 'Prompt');
export const videosToNotes = createRelationTable('VideoToNote', 'Video', 'Note');
export const videosToWildcards = createRelationTable('VideoToWildcard', 'Video', 'Wildcard');
export const videosToProperties = createRelationTable('VideoToProperty', 'Video', 'Property');
export const videosToGroups = createRelationTable('VideoToGroup', 'Video', 'Group');

export const videosRelations = relations(videos, ({ one, many }) => ({
    folder: one(folders, {
        fields: [videos.folderId],
        references: [folders.id],
    }),
    albums: many(albums, { through: videosToAlbums }),
    collections: many(collections, { through: videosToCollections }),
    tags: many(tags, { through: videosToTags }),
    characters: many(characters, { through: videosToCharacters }),
    places: many(places, { through: videosToPlaces }),
    worldItems: many(worldItems, { through: videosToWorldItems }),
    concepts: many(concepts, { through: videosToConcepts }),
    prompts: many(prompts, { through: videosToPrompts }),
    notes: many(notes, { through: videosToNotes }),
    wildcards: many(wildcards, { through: videosToWildcards }),
    properties: many(properties, { through: videosToProperties }),
    groups: many(groups, { through: videosToGroups }),
}));