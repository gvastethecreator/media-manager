/**
 * Contextos principales de la aplicación
 * Este archivo centraliza la exportación de todos los contextos y hooks relacionados
 */

// Exportaciones del contexto de archivos
export { FileProvider, useFiles, type FileItem } from './file-context';

// Exportaciones del contexto de configuración
export {
	SettingsProvider,
	useSettings,
	useTheme,
	useCollectionTagContext,
	useProfileContext,
	type Settings,
} from './settings-context';
