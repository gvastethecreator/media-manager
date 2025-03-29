import { integer, relations, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createCommonIndexes, organizationFields } from '../base/common';
import { createRelationTable } from '../base/relations';
import { images } from '../content/image';
import { videos } from '../content/video';

export const wildcards = sqliteTable(
    'Wildcard',
    {
        ...organizationFields,
        type: text('type').default('wildcard'),
        content: text('content').notNull(),
        format: text('format').default('text'),
        variables: text('variables').default('empty_array'),
        options: text('options').default('empty_array'),
        conditions: text('conditions').default('empty_array'),
        weight: integer('weight').default(1),
        frequency: integer('frequency').default(0),
        lastUsed: integer('lastUsed', { mode: 'timestamp_ms' }),
        metadata: text('metadata').default('empty_object'),
    },
    (table) => ({
        ...createCommonIndexes(table),
    })
);

// Tablas de relación
export const wildcardsToImages = createRelationTable('WildcardToImage', 'Wildcard', 'Image');
export const wildcardsToVideos = createRelationTable('WildcardToVideo', 'Wildcard', 'Video');

// Relaciones
export const wildcardsRelations = relations(wildcards, ({ many }) => ({
    images: many(images, { through: wildcardsToImages }),
    videos: many(videos, { through: wildcardsToVideos }),
}));