import { integer, relations, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createCommonIndexes, organizationFields } from '../base/common';
import { createRelationTable } from '../base/relations';
import { images } from '../content/image';
import { videos } from '../content/video';

export const prompts = sqliteTable(
    'Prompt',
    {
        ...organizationFields,
        type: text('type').default('text'),
        content: text('content').notNull(),
        template: text('template'),
        parameters: text('parameters').default('empty_array'),
        examples: text('examples').default('empty_array'),
        variations: text('variations').default('empty_array'),
        tags: text('tags').default('empty_array'),
        model: text('model'),
        provider: text('provider'),
        temperature: integer('temperature'),
        maxTokens: integer('maxTokens'),
        stopSequences: text('stopSequences').default('empty_array'),
        frequencyPenalty: integer('frequencyPenalty'),
        presencePenalty: integer('presencePenalty'),
        topP: integer('topP'),
        settings: text('settings').default('empty_object'),
        usage: text('usage').default('empty_object'),
        metrics: text('metrics').default('empty_object'),
        version: text('version').default('1.0'),
    },
    (table) => ({
        ...createCommonIndexes(table),
    })
);

// Tablas de relación
export const promptsToImages = createRelationTable('PromptToImage', 'Prompt', 'Image');
export const promptsToVideos = createRelationTable('PromptToVideo', 'Prompt', 'Video');

// Relaciones
export const promptsRelations = relations(prompts, ({ many }) => ({
    images: many(images, { through: promptsToImages }),
    videos: many(videos, { through: promptsToVideos }),
}));