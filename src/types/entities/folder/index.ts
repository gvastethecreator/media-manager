/**
 * @file Archivo de índice para exportar tipos de la entidad Folder
 * @module types/entities/folder
 */

// Alias para compatibilidad con código existente
export type {
	CreateFolderData,
	FolderBase,
	FolderComplete,
	FolderExtended,
	FolderExtendedComplete,
	FolderExtendedComplete as Folder,
	FolderFilters,
	FolderSummary,
	FolderTreeItem,
	UpdateFolderData,
} from './types';
export { FOLDER_SORT_PROPERTY_MAP, FolderSortCriteria } from './types';

// Ya no exportamos los archivos obsoletos
// export * from './base';
// export * from './enums';
// export * from './extended';
