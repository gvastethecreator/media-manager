import { integer, relations, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { baseFields, presentationFields } from '../base/common';
import { images } from '../content/image';
import { settings } from './settings';

export const profiles = sqliteTable('Profile', {
    ...baseFields,
    ...presentationFields,
    name: text('name').notNull(),
    description: text('description'),
    isActive: integer('isActive', { mode: 'boolean' }).notNull().default(false),
    settingsId: text('settingsId').references(() => settings.id),
    imageId: text('imageId').references(() => images.id),
});

export const profilesRelations = relations(profiles, ({ one }) => ({
    settings: one(settings, {
        fields: [profiles.settingsId],
        references: [settings.id],
    }),
    featuredImage: one(images, {
        fields: [profiles.imageId],
        references: [images.id],
    }),
}));