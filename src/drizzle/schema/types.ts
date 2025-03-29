import {
    albums,
    characters,
    collections,
    concepts,
    folders,
    groups,
    imageStats,
    images,
    notes,
    places,
    profiles,
    prompts,
    properties,
    queueJobs,
    settings,
    tags,
    uploadedImages,
    videos,
    wildcards,
    worldItems
} from '.';

// Tipos inferidos del sistema
export type Queue = typeof queueJobs.$inferSelect;
export type QueueInsert = typeof queueJobs.$inferInsert;

export type Profile = typeof profiles.$inferSelect;
export type ProfileInsert = typeof profiles.$inferInsert;

export type Settings = typeof settings.$inferSelect;
export type SettingsInsert = typeof settings.$inferInsert;

// Tipos inferidos de contenido
export type Folder = typeof folders.$inferSelect;
export type FolderInsert = typeof folders.$inferInsert;

export type Image = typeof images.$inferSelect;
export type ImageInsert = typeof images.$inferInsert;

export type ImageStats = typeof imageStats.$inferSelect;
export type ImageStatsInsert = typeof imageStats.$inferInsert;

export type UploadedImage = typeof uploadedImages.$inferSelect;
export type UploadedImageInsert = typeof uploadedImages.$inferInsert;

export type Video = typeof videos.$inferSelect;
export type VideoInsert = typeof videos.$inferInsert;

// Tipos inferidos de organización
export type Album = typeof albums.$inferSelect;
export type AlbumInsert = typeof albums.$inferInsert;

export type Collection = typeof collections.$inferSelect;
export type CollectionInsert = typeof collections.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type TagInsert = typeof tags.$inferInsert;

export type Group = typeof groups.$inferSelect;
export type GroupInsert = typeof groups.$inferInsert;

// Tipos inferidos de mundo
export type Character = typeof characters.$inferSelect;
export type CharacterInsert = typeof characters.$inferInsert;

export type Place = typeof places.$inferSelect;
export type PlaceInsert = typeof places.$inferInsert;

export type WorldItem = typeof worldItems.$inferSelect;
export type WorldItemInsert = typeof worldItems.$inferInsert;

// Tipos inferidos de utilidad
export type Concept = typeof concepts.$inferSelect;
export type ConceptInsert = typeof concepts.$inferInsert;

export type Prompt = typeof prompts.$inferSelect;
export type PromptInsert = typeof prompts.$inferInsert;

export type Note = typeof notes.$inferSelect;
export type NoteInsert = typeof notes.$inferInsert;

export type Wildcard = typeof wildcards.$inferSelect;
export type WildcardInsert = typeof wildcards.$inferInsert;

export type Property = typeof properties.$inferSelect;
export type PropertyInsert = typeof properties.$inferInsert;