/**
 * @file Exportaciones principales de tipos para UI
 * @module types/ui
 */

// Exportar tipos inferidos de esquemas
export type {
	InterfacePreferencesInput,
	InterfacePreferencesOutput,
} from './interface.schema';

// Exportar el esquema de validación
export { interfacePreferencesSchema } from './interface.schema';

// Exportar los tipos principales de UI
export type {
	InterfacePreferences,
	InterfaceSettingsState,
} from './types';
