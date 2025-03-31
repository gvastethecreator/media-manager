/**
 * @file Acciones principales para la entidad Folder
 * @module app/actions/folders
 */

// Re-exportar todas las acciones de transformers
export {
    createFolder,
    deleteFolder,
    getFolderById,
    getFolderWithStats,
    searchFolders,
    updateFolder
} from '@/transformers/folder';

// Re-exportar transformadores principales
export {
    transformFolder,
    transformFolderToExtended
} from '@/transformers/folder';

// Re-exportar serializadores
export {
    extendFolder,
    fromFolderComplete,
    fromPrismaFolder,
    generateFolderColor,
    generateFolderEmoji,
    normalizeFolderPath,
    normalizeFolderType,
    parseFolderFilters,
    validateFolder,
    withFolderStats
} from '@/transformers/folder';

// Re-exportar mappers
export {
    createFolderFilter,
    createFolderOrderBy,
    mapCreateFolderDataToPrisma,
    mapFolderFiltersToPrisma,
    mapFolderSearchOptionsToPrisma,
    mapUpdateFolderDataToPrisma,
    transformCompleteFolderToPrisma,
    transformFolderToPrisma
} from '@/transformers/folder';

// Re-exportar converters
export {
    mapFolderToFolder,
    toFolderComplete,
    toPrismaFolder
} from '@/transformers/folder';
