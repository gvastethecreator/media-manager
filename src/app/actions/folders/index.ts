/**
 * @file Acciones de carpetas
 * @module app/actions/folders
 */

// Re-exportar acciones de CRUD
export { createFolder, deleteFolder, updateFolder } from './crud.actions';

// Re-exportar acciones CRUD específicas
export {
    createFolder as createFolderAction, deleteFolder as deleteFolderAction, updateFolder as updateFolderAction
} from './folder-crud.actions';

// Re-exportar acciones de búsqueda y consulta
export {
    getFolderById, getFolders, getFoldersStats, getFolderTree, revalidateFolderRoutes,
    searchFolders
} from './query.actions';

// Re-exportar acciones específicas de obtención de carpetas
export { getFolders as getFoldersAction } from './folder-get.actions';

// Re-exportar acciones específicas de indexación de carpetas
export {
    indexFolder as indexFolderSpecific,
    reindexFolder as reindexFolderSpecific
} from './folder-indexing.actions';

// Re-exportar acciones de procesamiento
export {
    indexFolder, reindexFolder, repairFolder,
    validateFolderPath
} from './process.actions';

// Re-exportar acciones de diagnóstico
export {
    analyzeFolderHealth,
    checkFolderConsistency,
    getDuplicateFiles,
    getOrphanedImages
} from './folder-diagnostics';

// Re-exportar acciones de imágenes
export {
    getRecentFolderImages
} from './folder-images.actions';

// Re-exportar tipos existentes de folder-types
export type {
    CreateFolderOptions, ErrorResponse, FolderCreate, FolderError, FolderResponse, FolderUpdate,
    ImageEntity,
    ImageWithRelations, IndexCallbacks, IndexOptions, IndexState, ProcessStatus, ReindexOptions, UpdateFolderOptions
} from './folder-types';

export { createFolderError, FOLDER_ERROR_CODES, folderErrorToResponse, fromError, SUPPORTED_FORMATS } from './folder-types';

// Re-exportar estadísticas existentes
export {
    getFolderIndexingStats, getFolderStats, getFolderStatsById, // Funciones inexistentes eliminadas: getFileTypeDistribution, getFolderSizeDistribution
    getFolderStorageStats, revalidateFolderStats
} from './stats.actions';

// Re-exportar tipos base importados y re-exportados en folder-types
export type {
    CreateFolderData, FolderBase, FolderExtended, FolderStats, FolderSummary, UpdateFolderData
} from '@/types/entities/folder';

// Re-exportar acciones específicas para reindexación global
export {
    reindexAllFoldersInSystem as reindexAllFolders, // ✅ CORREGIDO: Función que reindexea TODAS las carpetas
    reindexAutoFolders // Función que reindexea solo carpetas marcadas para auto-reindex
} from './process.actions';

// NOTA: updateFolderAutoReindex parece no existir
// Se podría añadir una función específica en crud.actions.ts si es necesario

