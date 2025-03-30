/**
 * @file Tipos para configuración global
 * @module types/settings
 */

import type { JSONString } from '@/utils/types/utility-types';
import { z } from 'zod';
import { ThumbnailQuality } from './thumbnails';
import { ViewMode } from './ui.types';

/**
 * Tema de la aplicación
 */
export enum Theme {
    LIGHT = 'light',
    DARK = 'dark',
    SYSTEM = 'system'
}

/**
 * Idioma de la aplicación
 */
export enum Language {
    ES = 'es',
    EN = 'en'
}

/**
 * Configuración de interfaz
 */
export interface UISettings {
    theme: Theme;
    language: Language;
    defaultViewMode: ViewMode;
    animationsEnabled: boolean;
    sidebarExpanded: boolean;
    cardSize: number;
    gridColumns: number;
    thumbnailQuality: ThumbnailQuality;
    showFilenames: boolean;
    showMetadata: boolean;
    confirmDeletes: boolean;
}

/**
 * Configuración de importación
 */
export interface ImportSettings {
    importPath: string;
    watchFolder: boolean;
    createMissingFolders: boolean;
    parseMetadata: boolean;
    generateThumbnails: boolean;
    organizeByDate: boolean;
    skipDuplicates: boolean;
}

/**
 * Configuración de exportación
 */
export interface ExportSettings {
    exportPath: string;
    includeMetadata: boolean;
    includeThumbnails: boolean;
    formatOutput: boolean;
    maxConcurrent: number;
}

/**
 * Configuración de cache
 */
export interface CacheSettings {
    enabled: boolean;
    maxSize: number;
    ttl: number;
    cleanupInterval: number;
}

/**
 * Configuración completa
 */
export interface Settings {
    ui: UISettings;
    import: ImportSettings;
    export: ExportSettings;
    cache: CacheSettings;
    customization: JSONString<Record<string, unknown>>;
}

// Validaciones Zod
export const themeSchema = z.nativeEnum(Theme);
export const languageSchema = z.nativeEnum(Language);

export const uiSettingsSchema = z.object({
    theme: themeSchema,
    language: languageSchema,
    defaultViewMode: z.nativeEnum(ViewMode),
    animationsEnabled: z.boolean(),
    sidebarExpanded: z.boolean(),
    cardSize: z.number().min(50).max(500),
    gridColumns: z.number().min(1).max(12),
    thumbnailQuality: z.nativeEnum(ThumbnailQuality),
    showFilenames: z.boolean(),
    showMetadata: z.boolean(),
    confirmDeletes: z.boolean()
});

export const importSettingsSchema = z.object({
    importPath: z.string(),
    watchFolder: z.boolean(),
    createMissingFolders: z.boolean(),
    parseMetadata: z.boolean(),
    generateThumbnails: z.boolean(),
    organizeByDate: z.boolean(),
    skipDuplicates: z.boolean()
});

export const exportSettingsSchema = z.object({
    exportPath: z.string(),
    includeMetadata: z.boolean(),
    includeThumbnails: z.boolean(),
    formatOutput: z.boolean(),
    maxConcurrent: z.number().min(1).max(10)
});

export const cacheSettingsSchema = z.object({
    enabled: z.boolean(),
    maxSize: z.number().min(0),
    ttl: z.number().min(0),
    cleanupInterval: z.number().min(0)
});

export const settingsSchema = z.object({
    ui: uiSettingsSchema,
    import: importSettingsSchema,
    export: exportSettingsSchema,
    cache: cacheSettingsSchema,
    customization: z.string()
});

// Tipos inferidos
export type UISettingsValidated = z.infer<typeof uiSettingsSchema>;
export type ImportSettingsValidated = z.infer<typeof importSettingsSchema>;
export type ExportSettingsValidated = z.infer<typeof exportSettingsSchema>;
export type CacheSettingsValidated = z.infer<typeof cacheSettingsSchema>;
export type SettingsValidated = z.infer<typeof settingsSchema>;
