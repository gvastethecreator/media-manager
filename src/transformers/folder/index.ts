/**
 * @file Punto de entrada para los transformadores de la entidad Folder.
 * @module transformers/folder
 * @description Exporta de forma controlada las funciones de mapeo, serialización y transformación para la entidad Folder.
 */


// Exportar mappers y serializers
export * from './mappers';
export * from './serializers';

// Exportar tipos de transformer
export type { FolderFromPrisma } from './transformer';
// Exportar funciones principales optimizadas
// Exportar funciones legacy para compatibilidad
export {
    buildFolderTree, folderWithCountsPayload, foldersToRecord, fromPrismaFolder, fromPrismaFolderWithCounts, fromPrismaFolders,
    fromPrismaFoldersWithCounts, getAllFolders,
    getFolderById,
    transformFolderToExtended
} from './transformer';

