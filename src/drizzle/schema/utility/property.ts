import { integer, relations, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createCommonIndexes, organizationFields } from '../base/common';
import { createRelationTable } from '../base/relations';
import { images } from '../content/image';
import { videos } from '../content/video';

export const properties = sqliteTable(
    'Property',
    {
        ...organizationFields,
        type: text('type').default('string'),
        value: text('value'),
        defaultValue: text('defaultValue'),
        validation: text('validation').default('empty_object'),
        constraints: text('constraints').default('empty_array'),
        options: text('options').default('empty_array'),
        unit: text('unit'),
        format: text('format'),
        isRequired: integer('isRequired', { mode: 'boolean' }).default(false),
        isSystem: integer('isSystem', { mode: 'boolean' }).default(false),
        isHidden: integer('isHidden', { mode: 'boolean' }).default(false),
        isReadOnly: integer('isReadOnly', { mode: 'boolean' }).default(false),
        metadata: text('metadata').default('empty_object'),
    },
    (table) => ({
        ...createCommonIndexes(table),
    })
);

// Tablas de relación
export const propertiesToImages = createRelationTable('PropertyToImage', 'Property', 'Image');
export const propertiesToVideos = createRelationTable('PropertyToVideo', 'Property', 'Video');

// Relaciones
export const propertiesRelations = relations(properties, ({ many }) => ({
    images: many(images, { through: propertiesToImages }),
    videos: many(videos, { through: propertiesToVideos }),
}));