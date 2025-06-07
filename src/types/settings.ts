/**
 * @file Tipos para configuración global
 * @module types/settings
 */

import type {
    AdvancedSettings,
    AppearanceSettings,
    Language as LanguageType,
    NotificationsSettings,
    PrivacySettings,
    Settings as SettingsType,
    ThemeMode as ThemeModeType,
    UpdateSettings,
} from '@/transformers/settings/schema';

// Se importan los esquemas específicamente (no como tipos)
import { languageSchema, settingsSchema, themeModeSchema, updateSettingsSchema } from '@/transformers/settings/schema';

/**
 * Modos de visualización disponibles para componentes de vista de archivos
 */
export type ViewMode = 'grid' | 'list' | 'masonry' | 'cards';

// Re-exportamos los tipos para facilidad de uso
export type ThemeMode = ThemeModeType;
export type Language = LanguageType;
export type Settings = SettingsType;
export type SettingsUpdate = UpdateSettings;

// Re-exportamos los esquemas
export { languageSchema, settingsSchema, themeModeSchema, updateSettingsSchema };

// Exportación de tipos internos
    export type { AdvancedSettings, AppearanceSettings, NotificationsSettings, PrivacySettings };

