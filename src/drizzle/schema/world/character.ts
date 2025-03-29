import { integer, relations, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createCommonIndexes, organizationFields } from '../base/common';
import { createRelationTable } from '../base/relations';
import { images } from '../content/image';
import { videos } from '../content/video';

export const characters = sqliteTable(
    'Character',
    {
        ...organizationFields,
        age: text('age'),
        gender: text('gender'),
        species: text('species'),
        occupation: text('occupation'),
        background: text('background'),
        personality: text('personality'),
        abilities: text('abilities').default('empty_array'),
        relations: text('relations').default('empty_array'),
        backstory: text('backstory'),
        goals: text('goals').default('empty_array'),
        status: text('status').default('active'),
        health: integer('health').default(100),
        power: integer('power').default(0),
    },
    (table) => ({
        ...createCommonIndexes(table),
    })
);

// Tablas de relación
export const charactersToImages = createRelationTable('CharacterToImage', 'Character', 'Image');
export const charactersToVideos = createRelationTable('CharacterToVideo', 'Character', 'Video');

// Relaciones
export const charactersRelations = relations(characters, ({ many }) => ({
    images: many(images, { through: charactersToImages }),
    videos: many(videos, { through: charactersToVideos }),
}));