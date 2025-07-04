/**
 * @file Punto de entrada para los transformadores de la entidad Folder.
 * @module transformers/folder
 * @description Exporta de forma controlada las funciones de mapeo, serialización y transformación para la entidad Folder.
 */

// Exportar mappers y serializers
export * from './mappers';
export * from './serializers';

// Exportar funciones principales optimizadas
export {
	buildFolderTree,
	foldersToRecord,
	fromDrizzleFolder,
	fromDrizzleFolders,
	getAllFolders,
	getFolderById,
	transformFolderToExtended,
} from './transformer';
