import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { organizationFields } from '../base/common';
import { createIndexes, createManyToManyRelations, createRelationTable, relations } from '../base/relations';
import { images } from '../content/image';
import { videos } from '../content/video';
import { albums } from '../organization/album';
import { collections } from '../organization/collection';
import { groups } from '../organization/group';
import { tags } from '../organization/tag';
import { characters } from '../world/character';
import { places } from '../world/place';
import { worldItems } from '../world/worldItem';
import { concepts } from './concept';
import { notes } from './note';
import { prompts } from './prompt';
import { properties } from './property';

// Definir primero el tipo para evitar referencias circulares
export interface WildcardSelectType {
  id: number;
  name: string;
  description: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  parentId: number | null;
}

// Definición de la tabla
export const wildcards = sqliteTable(
    'Wildcard',
    {
        ...organizationFields,
        children: text('children').default('[]'),
        parentId: integer('parentId'),
    },
    (table) => {
        const indexes = createIndexes('wildcard');
        return {
            nameIdx: indexes.nameIdx.on(table.name),
            categoryIdx: indexes.categoryIdx.on(table.category),
            createdAtIdx: indexes.createdAtIdx.on(table.createdAt),
        };
    }
);

// Tablas de relación
export const wildcardsToImages = createRelationTable('WildcardToImage', 'Wildcard', 'Image');
export const wildcardsToVideos = createRelationTable('WildcardToVideo', 'Wildcard', 'Video');
export const wildcardsToAlbums = createRelationTable('WildcardToAlbum', 'Wildcard', 'Album');
export const wildcardsToCollections = createRelationTable('WildcardToCollection', 'Wildcard', 'Collection');
export const wildcardsToTags = createRelationTable('WildcardToTag', 'Wildcard', 'Tag');
export const wildcardsToCharacters = createRelationTable('WildcardToCharacter', 'Wildcard', 'Character');
export const wildcardsToPlaces = createRelationTable('WildcardToPlace', 'Wildcard', 'Place');
export const wildcardsToWorldItems = createRelationTable('WildcardToWorldItem', 'Wildcard', 'WorldItem');
export const wildcardsToConcepts = createRelationTable('WildcardToConcept', 'Wildcard', 'Concept');
export const wildcardsToNotes = createRelationTable('WildcardToNote', 'Wildcard', 'Note');
export const wildcardsToPrompts = createRelationTable('WildcardToPrompt', 'Wildcard', 'Prompt');
export const wildcardsToProperties = createRelationTable('WildcardToProperty', 'Wildcard', 'Property');
export const wildcardsToGroups = createRelationTable('WildcardToGroup', 'Wildcard', 'Group');

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
    properties,
    groups,
};

// Relaciones
export const wildcardsRelations = relations(wildcards, ({ one, many }) => {
    const manyRelations = createManyToManyRelations(relatedEntities)({ many });

    return {
        ...manyRelations,
    };
});