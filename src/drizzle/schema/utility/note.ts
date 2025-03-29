import { integer, relations, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createCommonIndexes, organizationFields } from '../base/common';
import { createRelationTable } from '../base/relations';
import { images } from '../content/image';
import { videos } from '../content/video';

export const notes = sqliteTable(
    'Note',
    {
        ...organizationFields,
        content: text('content').notNull(),
        format: text('format').default('markdown'),
        type: text('type').default('note'),
        status: text('status').default('draft'),
        priority: integer('priority').default(0),
        dueDate: integer('dueDate', { mode: 'timestamp_ms' }),
        completedAt: integer('completedAt', { mode: 'timestamp_ms' }),
        parentId: text('parentId').references(() => notes.id),
        tags: text('tags').default('empty_array'),
        references: text('references').default('empty_array'),
        attachments: text('attachments').default('empty_array'),
        metadata: text('metadata').default('empty_object'),
    },
    (table) => ({
        ...createCommonIndexes(table),
    })
);

// Tablas de relación
export const notesToImages = createRelationTable('NoteToImage', 'Note', 'Image');
export const notesToVideos = createRelationTable('NoteToVideo', 'Note', 'Video');

// Relaciones
export const notesRelations = relations(notes, ({ one, many }) => ({
    parent: one(notes, {
        fields: [notes.parentId],
        references: [notes.id],
    }),
    children: many(notes),
    images: many(images, { through: notesToImages }),
    videos: many(videos, { through: notesToVideos }),
}));