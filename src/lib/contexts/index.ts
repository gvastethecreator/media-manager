/**
 * Contextos principales de la aplicación
 * Este archivo centraliza la exportación de todos los contextos y hooks relacionados
 */

// Exportaciones del contexto de archivos (versión segura para Vite)
export { FileProvider, useFiles, type FileItem } from './file-context-safe';

// Exportaciones del contexto de configuración (versión segura para Vite)
export {
    SettingsProvider,
    useCollectionTagContext,
    useProfileContext,
    useSettings,
    useTheme, type Settings
} from './settings-context-safe';

