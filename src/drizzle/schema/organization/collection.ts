import { relations, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createCommonIndexes, organizationFields } from '../base/common';
import { createRelationTable } from '../base/relations';
import { images } from '../content/image';
import { videos } from '../content/video';

export const collections = sqliteTable(
    'Collection',
    {
        ...organizationFields,
        url: text('url'),
        alternativeUrl: text('alternativeUrl'),
        sourceImage: text('sourceImage'),
        platform: text('platform'),
        price: text('price'),
        network: text('network'),
        tokenId: text('tokenId'),
        tokenAddress: text('tokenAddress'),
        contractAddress: text('contractAddress'),
        contractType: text('contractType'),
        editions: text('editions').default('empty_array'),
    },
    (table) => ({
        ...createCommonIndexes(table),
    })
);

// Tablas de relación
export const collectionsToImages = createRelationTable('CollectionToImage', 'Collection', 'Image');
export const collectionsToVideos = createRelationTable('CollectionToVideo', 'Collection', 'Video');

// Relaciones
export const collectionsRelations = relations(collections, ({ many }) => ({
    images: many(images, { through: collectionsToImages }),
    videos: many(videos, { through: collectionsToVideos }),
}));