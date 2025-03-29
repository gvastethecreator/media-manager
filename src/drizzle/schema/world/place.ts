import { relations, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createCommonIndexes, organizationFields } from '../base/common';
import { createRelationTable } from '../base/relations';
import { images } from '../content/image';
import { videos } from '../content/video';

export const places = sqliteTable(
    'Place',
    {
        ...organizationFields,
        type: text('type').default('location'),
        climate: text('climate'),
        population: text('population'),
        government: text('government'),
        economy: text('economy'),
        culture: text('culture'),
        history: text('history'),
        landmarks: text('landmarks').default('empty_array'),
        resources: text('resources').default('empty_array'),
        dangers: text('dangers').default('empty_array'),
        parentId: text('parentId').references(() => places.id),
        coordinates: text('coordinates'),
        mapData: text('mapData'),
    },
    (table) => ({
        ...createCommonIndexes(table),
    })
);

// Tablas de relación
export const placesToImages = createRelationTable('PlaceToImage', 'Place', 'Image');
export const placesToVideos = createRelationTable('PlaceToVideo', 'Place', 'Video');

// Relaciones
export const placesRelations = relations(places, ({ one, many }) => ({
    parent: one(places, {
        fields: [places.parentId],
        references: [places.id],
    }),
    children: many(places),
    images: many(images, { through: placesToImages }),
    videos: many(videos, { through: placesToVideos }),
}));