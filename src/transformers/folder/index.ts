/**
 * @file Punto de entrada para los transformadores de la entidad Folder.
 * @module transformers/folder
 * @description Exporta de forma controlada las funciones de mapeo, serialización y transformación para la entidad Folder.
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

// Exportar mappers y serializers
export * from './mappers';
export * from './serializers';

// Exportar validadores y esquemas
export * from './validators';
export * from './schema';

// Exportar funciones principales optimizadas
export {
	buildFolderTree,
	foldersToRecord,
	fromDrizzleFolderWithCounts,
	fromDrizzleFoldersWithCounts,
	getAllFolders,
	getFolderById,
	transformFolderToExtended,
	// Funciones legacy para compatibilidad
	fromDrizzleFolder,
	fromDrizzleFolders,
} from './transformer';
