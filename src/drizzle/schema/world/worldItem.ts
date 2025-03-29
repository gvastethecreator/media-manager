import { integer, relations, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createCommonIndexes, organizationFields } from '../base/common';
import { createRelationTable } from '../base/relations';
import { images } from '../content/image';
import { videos } from '../content/video';

export const worldItems = sqliteTable(
    'WorldItem',
    {
        ...organizationFields,
        type: text('type').default('item'),
        rarity: text('rarity').default('common'),
        origin: text('origin'),
        creator: text('creator'),
        materials: text('materials').default('empty_array'),
        properties: text('properties').default('empty_array'),
        effects: text('effects').default('empty_array'),
        uses: text('uses').default('empty_array'),
        restrictions: text('restrictions').default('empty_array'),
        value: text('value'),
        weight: text('weight'),
        durability: integer('durability').default(100),
        charges: integer('charges'),
        cooldown: integer('cooldown'),
        level: integer('level').default(1),
    },
    (table) => ({
        ...createCommonIndexes(table),
    })
);

// Tablas de relación
export const worldItemsToImages = createRelationTable('WorldItemToImage', 'WorldItem', 'Image');
export const worldItemsToVideos = createRelationTable('WorldItemToVideo', 'WorldItem', 'Video');

// Relaciones
export const worldItemsRelations = relations(worldItems, ({ many }) => ({
    images: many(images, { through: worldItemsToImages }),
    videos: many(videos, { through: worldItemsToVideos }),
}));