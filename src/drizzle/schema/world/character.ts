import { integer, relations, sqliteTable, text } from 'drizzle-orm/sqlite-core';
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
import { places } from './place';
import { worldItems } from './worldItem';

export const characters = sqliteTable(
    'Character',
    {
        ...organizationFields,
        level: integer('level').default(1),
        class: text('class').default('unknown'),
        race: text('race').default('unknown'),
        type: text('type'),
        alignment: text('alignment').default('neutral'),
        backstory: text('backstory').default(''),
        stats: text('stats').default(''),
        psychologicalProfile: text('psychologicalProfile').default(''),
        socialProfile: text('socialProfile').default(''),
        relationships: text('relationships').default('empty_array'),
        goals: text('goals').default('empty_array'),
        fears: text('fears').default('empty_array'),
        beliefs: text('beliefs').default('empty_array'),
        personality: text('personality').default('empty_array'),
        skills: text('skills').default('empty_array'),
        abilities: text('abilities').default('empty_array'),
    },
    (table) => ({
        ...createCommonIndexes(table),
    })
);

// Tablas de relación
export const charactersToImages = createRelationTable('CharacterToImage', 'Character', 'Image');
export const charactersToVideos = createRelationTable('CharacterToVideo', 'Character', 'Video');
export const charactersToAlbums = createRelationTable('CharacterToAlbum', 'Character', 'Album');
export const charactersToCollections = createRelationTable('CharacterToCollection', 'Character', 'Collection');
export const charactersToTags = createRelationTable('CharacterToTag', 'Character', 'Tag');
export const charactersToPlaces = createRelationTable('CharacterToPlace', 'Character', 'Place');
export const charactersToWorldItems = createRelationTable('CharacterToWorldItem', 'Character', 'WorldItem');
export const charactersToConcepts = createRelationTable('CharacterToConcept', 'Character', 'Concept');
export const charactersToPrompts = createRelationTable('CharacterToPrompt', 'Character', 'Prompt');
export const charactersToNotes = createRelationTable('CharacterToNote', 'Character', 'Note');
export const charactersToWildcards = createRelationTable('CharacterToWildcard', 'Character', 'Wildcard');
export const charactersToProperties = createRelationTable('CharacterToProperty', 'Character', 'Property');
export const charactersToGroups = createRelationTable('CharacterToGroup', 'Character', 'Group');
export const characterToCharacterRelations = createRelationTable('CharacterRelations', 'Character', 'Character');

// Relaciones
export const charactersRelations = relations(characters, ({ many }) => ({
    images: many(images, { through: charactersToImages }),
    videos: many(videos, { through: charactersToVideos }),
    albums: many(albums, { through: charactersToAlbums }),
    collections: many(collections, { through: charactersToCollections }),
    tags: many(tags, { through: charactersToTags }),
    places: many(places, { through: charactersToPlaces }),
    worldItems: many(worldItems, { through: charactersToWorldItems }),
    concepts: many(concepts, { through: charactersToConcepts }),
    prompts: many(prompts, { through: charactersToPrompts }),
    notes: many(notes, { through: charactersToNotes }),
    wildcards: many(wildcards, { through: charactersToWildcards }),
    properties: many(properties, { through: charactersToProperties }),
    groups: many(groups, { through: charactersToGroups }),
    relatedCharacters: many(characters, { through: characterToCharacterRelations }),
    relatedTo: many(characters, { through: characterToCharacterRelations }),
}));