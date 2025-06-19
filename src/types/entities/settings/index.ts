/**
 * @file Exportaciones principales de tipos para la entidad Settings
 * @module types/entities/settings
 */

// Exportar tipos inferidos de esquemas
export type {
	InterfacePreferencesInput,
	InterfacePreferencesOutput,
} from './interface.schema';

// Exportar el esquema de validación
export { interfacePreferencesSchema } from './interface.schema';
// Exportar los tipos principales
export type {
	InterfacePreferences,
	InterfaceSettingsState,
	SettingsBase,
	SettingsCreateInput,
	SettingsUpdateInput,
} from './types';
