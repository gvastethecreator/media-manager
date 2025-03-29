import { sqliteTable } from 'drizzle-orm/sqlite-core';
import { organizationFields } from '../base/common';
import { createIndexes, createManyToManyRelations, createRelationTable, relations } from '../base/relations';
import { images } from '../content/image';
import { videos } from '../content/video';
import { concepts } from '../utility/concept';
import { notes } from '../utility/note';
import { prompts } from '../utility/prompt';
import { properties } from '../utility/property';
import { wildcards } from '../utility/wildcard';
import { characters } from '../world/character';
import { places } from '../world/place';
import { worldItems } from '../world/worldItem';
import { albums } from './album';
import { collections } from './collection';
import { tags } from './tag';

// Definición de la tabla
export const groups = sqliteTable(
    'Group',
    {
        ...organizationFields,
    },
    (table) => {
        const indexes = createIndexes('group');
        return {
            nameIdx: indexes.nameIdx.on(table.name),
            categoryIdx: indexes.categoryIdx.on(table.category),
            createdAtIdx: indexes.createdAtIdx.on(table.createdAt),
        };
    }
);

// Tablas de relación
export const groupsToImages = createRelationTable('GroupToImage', 'Group', 'Image');
export const groupsToVideos = createRelationTable('GroupToVideo', 'Group', 'Video');
export const groupsToAlbums = createRelationTable('GroupToAlbum', 'Group', 'Album');
export const groupsToCollections = createRelationTable('GroupToCollection', 'Group', 'Collection');
export const groupsToTags = createRelationTable('GroupToTag', 'Group', 'Tag');
export const groupsToCharacters = createRelationTable('GroupToCharacter', 'Group', 'Character');
export const groupsToPlaces = createRelationTable('GroupToPlace', 'Group', 'Place');
export const groupsToWorldItems = createRelationTable('GroupToWorldItem', 'Group', 'WorldItem');
export const groupsToConcepts = createRelationTable('GroupToConcept', 'Group', 'Concept');
export const groupsToNotes = createRelationTable('GroupToNote', 'Group', 'Note');
export const groupsToPrompts = createRelationTable('GroupToPrompt', 'Group', 'Prompt');
export const groupsToWildcards = createRelationTable('GroupToWildcard', 'Group', 'Wildcard');
export const groupsToProperties = createRelationTable('GroupToProperty', 'Group', 'Property');

// Definición de relaciones
const relatedEntities = {
    images,
    videos,
    albums,
    collections,
    tags,
    characters,
    places,
    worldItems,
    concepts,
    notes,
    prompts,
    wildcards,
    properties,
};

// Relaciones
export const groupsRelations = relations(groups, createManyToManyRelations(relatedEntities));