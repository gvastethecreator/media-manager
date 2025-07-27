/**
 * @file Punto de entrada para los transformadores de la entidad Folder.
 * @module transformers/folder
 * @description Exporta de forma controlada las funciones de mapeo, serialización y transformación para la entidad Folder.
 
 */

// Exportar tipos
export type {
	FolderBase,
	FolderCreateInput,
	FolderStatistics,
	FolderUpdateInput,
	FolderWithStats,
} from '../../types/entities/folder/types';

// Exportar mappers y serializers
export * from './mappers';
export * from './schema';
export * from './serializers';
// Exportar funciones principales optimizadas
export {
	buildFolderTree,
	foldersToRecord,
	// Funciones legacy para compatibilidad
	fromDrizzleFolder,
	fromDrizzleFolders,
	fromDrizzleFoldersWithCounts,
	fromDrizzleFolderWithCounts,
	getAllFolders,
	getFolderById,
	transformFolderToExtended,
} from './transformer';
// Exportar validadores y esquemas
export * from './validators';
