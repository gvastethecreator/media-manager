/**
 * @file Punto de entrada para los transformadores de la entidad File.
 * @module transformers/file
 * @description Exporta funciones de transformación, validación y serialización para File.
 * ✅ MIGRADO A DRIZZLE - Enero 2025
 */

// --- Transformadores principales ---
export {
	getFilesSummary,
	groupFilesByType,
	toFileWithStats,
	toFileWithStatsList,
} from './mappers';
// --- Schema de Drizzle ---
export {
	type FileInsert,
	type FileSchema,
	filesTable,
	fileTypeEnum,
} from './schema';
// --- Serializadores ---
export {
	serializeDirectoryStructure,
	serializeFileBase,
	serializeFileGroupedStats,
	serializeFileList,
	serializeFileWithStats,
} from './serializers';
// --- Validadores y esquemas ---
export {
	type FileBase,
	type FileCreateInput,
	type FileSearchInput,
	type FileStatistics,
	type FileUpdateInput,
	type FileWithStats,
	fileBaseSchema,
	fileCreateSchema,
	fileSearchSchema,
	fileStatisticsSchema,
	fileUpdateSchema,
	fileWithStatsSchema,
} from './validators';

/**
 * Transforma un array de archivos base a archivos mejorados
 * @param files Array de archivos base
 * @returns Array de archivos transformados y mejorados
 */
export function transformFiles(files: any[]): any[] {
	try {
		return files.map((file) => {
			if (file.isDirectory) {
				return toEnhancedDirectory(file);
			}
			return toEnhancedImageFile(file);
		});
	} catch (error) {
		console.error('Error transformando archivos:', error);
		return [];
	}
}

// Reexportaciones explícitas
export type {
	applyFileFilters,
	// Desde serializers
	deserializeImageMetadata,
	determineFileType,
	determineMimeType,
	// formatFileSize se importa desde utils, no se reexporta desde aquí
	// Desde mappers
	generateFileId,
	getColorForFileType,
	getIconForFileType,
	mapStatsToFileInfo,
	pathsToTreeStructure,
	serializeDirectoryContents,
	serializeFileListForUI,
	serializeFileOperationResult,
	serializeImageMetadata,
	toEnhancedDirectory,
	toEnhancedImageFile,
	toFileListItem,
};

// Objeto consolidado (opcional, pero mantenido por compatibilidad)
// Asegúrate de que todas las funciones añadidas aquí también estén en la exportación explícita de arriba.
export const fileTransformer = {
	// Desde mappers
	generateFileId,
	determineFileType,
	determineMimeType,
	mapStatsToFileInfo,
	toFileListItem,
	getIconForFileType,
	getColorForFileType,
	applyFileFilters,
	toEnhancedDirectory,
	toEnhancedImageFile,
	transformFiles,

	// Desde serializers
	deserializeImageMetadata,
	serializeImageMetadata,
	// formatFileSize no pertenece a este transformador, se consume desde los utils
	pathsToTreeStructure,
	serializeDirectoryContents,
	serializeFileListForUI,
	serializeFileOperationResult,
};

export default fileTransformer;
