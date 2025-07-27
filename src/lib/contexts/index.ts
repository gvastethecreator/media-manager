/**
 * Contextos principales de la aplicación
 * Este archivo centraliza la exportación de todos los contextos y hooks relacionados
 */

// Exportaciones del contexto de archivos
export { FileProvider, useFiles } from './file-context';

// Exportaciones del contexto de configuración
export {
	type Settings,
	SettingsProvider,
	useCollectionTagContext,
	useProfileContext,
	useSettings,
	useThemeSync,
} from './settings-context';

// Exportaciones del contexto de tema
export { ThemeProvider as NativeThemeProvider, useTheme as useNativeTheme } from './theme-context';
