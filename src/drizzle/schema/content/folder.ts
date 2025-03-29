import type { InferModel } from 'drizzle-orm'; // Cambia la importación a solo tipo
import { relations } from 'drizzle-orm'; // Corrige la importación de 'relations'
import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { baseFields, contentFields, presentationFields, visualFields } from '../base/common';

export const folderVisualConfigs = sqliteTable('FolderVisualConfig', {
    ...baseFields,
    enable3DEffect: integer('enable3DEffect', { mode: 'boolean' }).notNull().default(true),
    designSystem: text('designSystem').default('default_design_system'),
    enableHolographicEffect: integer('enableHolographicEffect', { mode: 'boolean' }).notNull().default(true),
    enableGlowEffect: integer('enableGlowEffect', { mode: 'boolean' }).notNull().default(true),
    enableAnimatedBorder: integer('enableAnimatedBorder', { mode: 'boolean' }).notNull().default(true),
    enableLightHalo: integer('enableLightHalo', { mode: 'boolean' }).notNull().default(true),
    layerSystem: text('layerSystem').default('default_layer_system'),
    effects: text('effects').default('default_effects'),
    performance: text('performance').default('default_performance'),
    states: text('states').default('default_states'),
});

export const folders = sqliteTable(
    'Folder',
    {
        ...baseFields,
        ...contentFields,
        ...presentationFields,
        ...visualFields,
        path: text('path').notNull().unique(),
        parentId: text('parentId').references<string>(() => folders.id, { onDelete: 'cascade' }),
        visualConfigId: text('visualConfigId')
            .references(() => folderVisualConfigs.id)
            .unique(),
        totalFiles: integer('totalFiles').notNull().default(0),
        totalSize: integer('totalSize').notNull().default(0),
        lastIndexed: integer('lastIndexed', { mode: 'timestamp_ms' }).default(new Date()), // Corrige el tipo de valor
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

export type Folder = InferModel<typeof folders>; // Define explícitamente el tipo Folder

export const foldersRelations = relations(folders, ({ one, many }) => ({
    parent: one(folders, {
        fields: [folders.parentId],
        references: [folders.id],
    }),
    children: many(folders),
    visualConfig: one(folderVisualConfigs, {
        fields: [folders.visualConfigId],
        references: [folderVisualConfigs.id],
    }),
}));

export const folderVisualConfigsRelations = relations(folderVisualConfigs, ({ one }) => ({
    folder: one(folders, {
        fields: [folderVisualConfigs.id],
        references: [folders.visualConfigId],
    }),
}));