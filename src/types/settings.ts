/**
 * @file Tipos para configuración global
 * @module types/settings
 */

// Re-export directo de tipos y esquemas para evitar noExportedImports
export type {
	AdvancedSettings,
	AppearanceSettings,
	Language,
	NotificationsSettings,
	PrivacySettings,
	Settings,
	ThemeMode,
	UpdateSettings as SettingsUpdate,
} from '@/transformers/settings/schema';
export { languageSchema, settingsSchema, themeModeSchema, updateSettingsSchema } from '@/transformers/settings/schema';

/**
 * Modos de visualización disponibles para componentes de vista de archivos
 */
export type ViewMode = 'grid' | 'list' | 'masonry' | 'cards';
