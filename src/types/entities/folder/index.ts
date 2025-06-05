/**
 * @file Archivo de índice para exportar tipos de la entidad Folder
 * @module types/entities/folder
 */

export type {
	CreateFolderData,
	FolderBase,
	FolderComplete,
	FolderExtended,
	FolderExtendedComplete,
	FolderFilters,
	FolderSummary,
	FolderTreeItem,
	UpdateFolderData,
} from './types';

export { FOLDER_SORT_PROPERTY_MAP, FolderSortCriteria } from './types';

// Alias para compatibilidad con código existente
export type { FolderExtendedComplete as Folder } from './types';

// Ya no exportamos los archivos obsoletos
// export * from './base';
// export * from './enums';
// export * from './extended';
