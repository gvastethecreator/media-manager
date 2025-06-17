/**
 * Contextos principales de la aplicación
 * Este archivo centraliza la exportación de todos los contextos y hooks relacionados
 */

// Exportaciones del contexto de archivos
export { type FileItem, FileProvider, useFiles } from './file-context';

// Exportaciones del contexto de configuración
export {
	type Settings,
	SettingsProvider,
	useCollectionTagContext,
	useProfileContext,
	useSettings,
	useTheme,
} from './settings-context';
