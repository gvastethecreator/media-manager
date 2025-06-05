/**
 * @file Punto de entrada para transformadores de File
 * @module transformers/file
 */

// Importaciones explícitas desde mappers
import {
	applyFileFilters,
	determineFileType,
	determineMimeType,
	generateFileId,
	getColorForFileType,
	getIconForFileType,
	mapStatsToFileInfo,
	toEnhancedDirectory,
	toEnhancedImageFile,
	toFileListItem, // Mantenemos esta que sí existe
} from './mappers';

// Importaciones explícitas desde serializers
import {
	deserializeImageMetadata,
	formatFileSize,
	pathsToTreeStructure,
	serializeDirectoryContents,
	serializeFileListForUI,
	serializeFileOperationResult,
	serializeImageMetadata,
} from './serializers';

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
export {
	applyFileFilters,
	// Desde serializers
	deserializeImageMetadata,
	determineFileType,
	determineMimeType,
	formatFileSize,
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
	formatFileSize,
	pathsToTreeStructure,
	serializeDirectoryContents,
	serializeFileListForUI,
	serializeFileOperationResult,
};

export default fileTransformer;
