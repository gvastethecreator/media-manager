import type { InferModel } from 'drizzle-orm'; // Cambia la importación a solo tipo
import { relations } from 'drizzle-orm'; // Corrige la importación de 'relations'
import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { baseFields, contentFields, presentationFields, visualFields } from '../base/common';

// Definimos la tabla sin referencias circulares
export const folders = sqliteTable(
    'Folder',
    {
        ...baseFields,
        ...contentFields,
        ...presentationFields,
        ...visualFields,
        path: text('path').notNull().unique(),
        // Usamos parentId sin referencia, la manejaremos a través de relaciones
        parentId: text('parentId'),
        totalFiles: integer('totalFiles').notNull().default(0),
        totalSize: integer('totalSize').notNull().default(0),
        lastIndexed: integer('lastIndexed', { mode: 'timestamp_ms' }).default(new Date()),
        autoReindex: integer('autoReindex', { mode: 'boolean' }).notNull().default(false),
        presetId: text('presetId'),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.id] }),
        pathIdx: index('folder_path_idx').on(table.path),
        lastIndexedIdx: index('folder_last_indexed_idx').on(table.lastIndexed),
        createdAtIdx: index('folder_created_at_idx').on(table.createdAt),
    })
);

export type Folder = InferModel<typeof folders>;

// Definimos las relaciones explícitamente para manejar la autorreferencia
export const foldersRelations = relations(folders, ({ one, many }) => ({
    parent: one(folders, {
        fields: [folders.parentId],
        references: [folders.id],
        relationName: 'folder_parent_child',
    }),
    children: many(folders, {
        relationName: 'folder_parent_child',
    }),
}));