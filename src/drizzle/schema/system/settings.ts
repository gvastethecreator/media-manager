import { relations, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { baseFields } from '../base/common';
import { profiles } from './profile';

export const settings = sqliteTable('Settings', {
    ...baseFields,
    theme: text('theme').notNull().default('system'),
    language: text('language').notNull().default('es'),
    profileId: text('profileId').unique(),
});

export const settingsRelations = relations(settings, ({ one }) => ({
    profile: one(profiles, {
        fields: [settings.profileId],
        references: [profiles.id],
    }),
}));