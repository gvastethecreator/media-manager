import { relations, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createCommonIndexes, organizationFields } from '../base/common';
import { createRelationTable } from '../base/relations';
import { images } from '../content/image';
import { videos } from '../content/video';

export const groups = sqliteTable(
    'Group',
    {
        ...organizationFields,
        parentId: text('parentId').references(() => groups.id),
        layout: text('layout').default('grid'),
        view: text('view').default('default'),
    },
    (table) => ({
        ...createCommonIndexes(table),
    })
);

// Tablas de relación
export const groupsToImages = createRelationTable('GroupToImage', 'Group', 'Image');
export const groupsToVideos = createRelationTable('GroupToVideo', 'Group', 'Video');

// Relaciones
export const groupsRelations = relations(groups, ({ one, many }) => ({
    parent: one(groups, {
        fields: [groups.parentId],
        references: [groups.id],
    }),
    children: many(groups),
    images: many(images, { through: groupsToImages }),
    videos: many(videos, { through: groupsToVideos }),
}));