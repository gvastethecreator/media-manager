import { relations, sqliteTable } from 'drizzle-orm/sqlite-core';
import { createCommonIndexes, organizationFields } from '../base/common';
import { createRelationTable } from '../base/relations';
import { images } from '../content/image';
import { videos } from '../content/video';

export const tags = sqliteTable(
    'Tag',
    {
        ...organizationFields,
    },
    (table) => ({
        ...createCommonIndexes(table),
    })
);

// Tablas de relación
export const tagsToImages = createRelationTable('TagToImage', 'Tag', 'Image');
export const tagsToVideos = createRelationTable('TagToVideo', 'Tag', 'Video');

// Relaciones
export const tagsRelations = relations(tags, ({ many }) => ({
    images: many(images, { through: tagsToImages }),
    videos: many(videos, { through: tagsToVideos }),
}));