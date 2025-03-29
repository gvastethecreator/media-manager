import { relations, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createCommonIndexes, organizationFields } from '../base/common';
import { createRelationTable } from '../base/relations';
import { images } from '../content/image';
import { videos } from '../content/video';
import { albums } from '../organization/album';
import { collections } from '../organization/collection';
import { groups } from '../organization/group';
import { tags } from '../organization/tag';
import { concepts } from '../utility/concept';
import { notes } from '../utility/note';
import { prompts } from '../utility/prompt';
import { properties } from '../utility/property';
import { wildcards } from '../utility/wildcard';
import { characters } from './character';
import { places } from './place';

export const worldItems = sqliteTable(
    'WorldItem',
    {
        ...organizationFields,
        type: text('type').default('misc'),
        rarity: text('rarity').default('common'),
        attributes: text('attributes').default('empty_array'),
        effects: text('effects').default('empty_array'),
        size: text('size').default('medium'),
        requirements: text('requirements').default(''),
        origin: text('origin').default(''),
        stats: text('stats').default(''),
    },
    (table) => ({
        ...createCommonIndexes(table),
    })
);

// Tablas de relación
export const worldItemsToImages = createRelationTable('WorldItemToImage', 'WorldItem', 'Image');
export const worldItemsToVideos = createRelationTable('WorldItemToVideo', 'WorldItem', 'Video');
export const worldItemsToAlbums = createRelationTable('WorldItemToAlbum', 'WorldItem', 'Album');
export const worldItemsToCollections = createRelationTable('WorldItemToCollection', 'WorldItem', 'Collection');
export const worldItemsToTags = createRelationTable('WorldItemToTag', 'WorldItem', 'Tag');
export const worldItemsToCharacters = createRelationTable('WorldItemToCharacter', 'WorldItem', 'Character');
export const worldItemsToPlaces = createRelationTable('WorldItemToPlace', 'WorldItem', 'Place');
export const worldItemsToConcepts = createRelationTable('WorldItemToConcept', 'WorldItem', 'Concept');
export const worldItemsToPrompts = createRelationTable('WorldItemToPrompt', 'WorldItem', 'Prompt');
export const worldItemsToNotes = createRelationTable('WorldItemToNote', 'WorldItem', 'Note');
export const worldItemsToWildcards = createRelationTable('WorldItemToWildcard', 'WorldItem', 'Wildcard');
export const worldItemsToProperties = createRelationTable('WorldItemToProperty', 'WorldItem', 'Property');
export const worldItemsToGroups = createRelationTable('WorldItemToGroup', 'WorldItem', 'Group');

// Relaciones
export const worldItemsRelations = relations(worldItems, ({ many }) => ({
    images: many(images, { through: worldItemsToImages }),
    videos: many(videos, { through: worldItemsToVideos }),
    albums: many(albums, { through: worldItemsToAlbums }),
    collections: many(collections, { through: worldItemsToCollections }),
    tags: many(tags, { through: worldItemsToTags }),
    characters: many(characters, { through: worldItemsToCharacters }),
    places: many(places, { through: worldItemsToPlaces }),
    concepts: many(concepts, { through: worldItemsToConcepts }),
    prompts: many(prompts, { through: worldItemsToPrompts }),
    notes: many(notes, { through: worldItemsToNotes }),
    wildcards: many(wildcards, { through: worldItemsToWildcards }),
    properties: many(properties, { through: worldItemsToProperties }),
    groups: many(groups, { through: worldItemsToGroups }),
}));