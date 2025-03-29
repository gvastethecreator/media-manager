import { relations, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createCommonIndexes, organizationFields } from '../base/common';
import { createRelationTable } from '../base/relations';
import { images } from '../content/image';
import { videos } from '../content/video';

export const concepts = sqliteTable(
    'Concept',
    {
        ...organizationFields,
        type: text('type').default('concept'),
        keywords: text('keywords').default('empty_array'),
        variations: text('variations').default('empty_array'),
        references: text('references').default('empty_array'),
        examples: text('examples').default('empty_array'),
        counterexamples: text('counterexamples').default('empty_array'),
        relatedConcepts: text('relatedConcepts').default('empty_array'),
        domain: text('domain'),
        complexity: text('complexity').default('medium'),
        status: text('status').default('draft'),
    },
    (table) => ({
        ...createCommonIndexes(table),
    })
);

// Tablas de relación
export const conceptsToImages = createRelationTable('ConceptToImage', 'Concept', 'Image');
export const conceptsToVideos = createRelationTable('ConceptToVideo', 'Concept', 'Video');

// Relaciones
export const conceptsRelations = relations(concepts, ({ many }) => ({
    images: many(images, { through: conceptsToImages }),
    videos: many(videos, { through: conceptsToVideos }),
}));