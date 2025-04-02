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
    toFileListItem // Mantenemos esta que sí existe
} from './mappers';

// Importaciones explícitas desde serializers
import {
    deserializeImageMetadata,
    formatFileSize,
    pathsToTreeStructure,
    serializeDirectoryContents,
    serializeFileListForUI,
    serializeFileOperationResult,
} from './serializers';

// Reexportaciones explícitas
export {
    applyFileFilters,
    // Desde serializers
    deserializeImageMetadata, determineFileType,
    determineMimeType, formatFileSize,
    // Desde mappers
    generateFileId, getColorForFileType, getIconForFileType, mapStatsToFileInfo, pathsToTreeStructure,
    serializeDirectoryContents,
    serializeFileListForUI,
    serializeFileOperationResult, toEnhancedDirectory,
    toEnhancedImageFile, toFileListItem
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

    // Desde serializers
    deserializeImageMetadata,
    formatFileSize,
    pathsToTreeStructure,
    serializeDirectoryContents,
    serializeFileListForUI,
    serializeFileOperationResult,
};

export default fileTransformer;

