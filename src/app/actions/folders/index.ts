/**
 * @file Acciones de carpetas - Índice centralizado
 * @module app/actions/folders
 */

// ✅ Re-exportar acciones CRUD específicas
export {
    createFolder,
    deleteFolder,
    updateFolder,
    updateFolderAutoReindex
} from './folder-crud.actions';

// ✅ Re-exportar acciones de búsqueda y consulta
export {
    getFolderById, getFolderTree, getFolders,
    getFoldersStats, revalidateFolderRoutes,
    searchFolders
} from './query.actions';

// ✅ Re-exportar acciones específicas de obtención de carpetas
export {
    getFolderById as getFolderByIdFromGet, getFolders as getFoldersFromGet, getFoldersWithFilter
} from './folder-get.actions';

// ✅ Re-exportar acciones específicas de indexación de carpetas (usando las más optimizadas)
export {
    indexFolder,
    reindexFolder
} from './folder-indexing.actions';

// ✅ Re-exportar acciones de procesamiento (usando alias para evitar conflictos)
export {
    reindexAllFoldersInSystem as reindexAllFolders, reindexAutoFolders, repairFolder,
    validateFolderPath
} from './process.actions';

// ✅ Re-exportar acciones de diagnóstico
export {
    analyzeFolderHealth,
    checkFolderConsistency,
    getDuplicateFiles,
    getOrphanedImages
} from './folder-diagnostics';

// ✅ Re-exportar acciones de imágenes en carpetas
export {
    getRecentFolderImages
} from './folder-images.actions';

// ✅ Re-exportar acción para obtener todas las imágenes de una carpeta
export {
    getFolderImages
} from './get-folder-images.actions';

// ✅ Re-exportar estadísticas
export {
    getFolderIndexingStats, getFolderStats,
    getFolderStatsById,
    getFolderStorageStats, revalidateFolderStats
} from './stats.actions';

// ✅ Re-exportar tipos existentes de folder-types
export type {
    CreateFolderOptions,
    ErrorResponse,
    FolderCreate,
    FolderError,
    FolderResponse,
    FolderUpdate,
    ImageEntity,
    ImageWithRelations,
    IndexCallbacks,
    IndexOptions,
    IndexState,
    ProcessStatus,
    ReindexOptions,
    UpdateFolderOptions
} from './folder-types';

export {
    FOLDER_ERROR_CODES, SUPPORTED_FORMATS, createFolderError, folderErrorToResponse,
    fromError
} from './folder-types';

// ✅ Re-exportar tipos base desde @/types/entities/folder
export type {
    CreateFolderData,
    FolderBase,
    FolderExtended,
    FolderSummary,
    UpdateFolderData
} from '@/types/entities/folder';

