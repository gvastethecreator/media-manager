/**
 * @file Re-exportación de tipos para la entidad File
 * @module types/entities/file
 */

export * from './base';
export * from './enums';
// Re-exportar enums específicos para facilitar su uso
export {
	CommonMimeType,
	FILE_EXTENSION_GROUPS,
	FileErrorCode,
	FileEventType,
	FilePermission,
	FileSortOption,
	FileType,
} from './enums';
export * from './extended';
