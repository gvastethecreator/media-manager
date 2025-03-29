import { relations, sqliteTable } from 'drizzle-orm/sqlite-core';
import { createCommonIndexes, organizationFields } from '../base/common';
import { createRelationTable } from '../base/relations';
import { images } from '../content/image';
import { videos } from '../content/video';

export const albums = sqliteTable(
    'Album',
    {
        ...organizationFields,
    },
    (table) => ({
        ...createCommonIndexes(table),
    })
);

// Tablas de relación
export const albumsToImages = createRelationTable('AlbumToImage', 'Album', 'Image');
export const albumsToVideos = createRelationTable('AlbumToVideo', 'Album', 'Video');

// Relaciones
export const albumsRelations = relations(albums, ({ many }) => ({
    images: many(images, { through: albumsToImages }),
    videos: many(videos, { through: albumsToVideos }),
}));