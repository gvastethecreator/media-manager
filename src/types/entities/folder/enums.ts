/**
 * @file Enumeraciones para la entidad Folder
 * @module types/entities/folder/enums
 */

/**
 * 📊 Criterios de ordenación para Folders
 */
export enum FolderSortBy {
	NAME_ASC = 'NAME_ASC',
	NAME_DESC = 'NAME_DESC',
	CREATED_ASC = 'CREATED_ASC',
	CREATED_DESC = 'CREATED_DESC',
	UPDATED_ASC = 'UPDATED_ASC',
	UPDATED_DESC = 'UPDATED_DESC',
	PATH_ASC = 'PATH_ASC',
	PATH_DESC = 'PATH_DESC',
}

/**
 * 📂 Tipos de Folder
 */
export enum FolderType {
	STANDARD = 'STANDARD',
	SYSTEM = 'SYSTEM',
	VIRTUAL = 'VIRTUAL',
	ALBUM = 'ALBUM',
	COLLECTION = 'COLLECTION',
}

/**
 * 👁️ Modos de visualización para Folders
 */
export enum FolderViewMode {
	GRID = 'GRID',
	LIST = 'LIST',
	TREE = 'TREE',
	DETAILS = 'DETAILS',
}

/**
 * 🚩 Estado de sincronización de un Folder
 */
export enum FolderSyncState {
	SYNCED = 'SYNCED',
	PENDING = 'PENDING',
	SYNCING = 'SYNCING',
	ERROR = 'ERROR',
	NOT_SYNCED = 'NOT_SYNCED',
}

/**
 * 📋 Estado de indexación de un Folder
 */
export enum FolderIndexState {
	INDEXED = 'INDEXED',
	INDEXING = 'INDEXING',
	PENDING = 'PENDING',
	ERROR = 'ERROR',
	NOT_INDEXED = 'NOT_INDEXED',
}
