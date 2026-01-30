/**
 * @file Enums para la entidad Folder
 * @module types/entities/folder/enums
 * @description Enumeraciones para criterios de ordenación, tipos, y otros valores de Folder
 */

/**
 * 📂 Criterios de ordenación para carpetas
 */
export enum FolderSortCriteria {
	// Alfabético
	NAME_ASC = 'name_asc',
	NAME_DESC = 'name_desc',

	// Por fecha
	DATE_ASC = 'date_asc',
	DATE_DESC = 'date_desc',

	// Por tamaño
	SIZE_ASC = 'size_asc',
	SIZE_DESC = 'size_desc',

	// Por cantidad de archivos
	FILES_ASC = 'files_asc',
	FILES_DESC = 'files_desc',

	// Por organización
	ORGANIZATION_ASC = 'organization_asc',
	ORGANIZATION_DESC = 'organization_desc',

	// Por jerarquía
	DEPTH_ASC = 'depth_asc',
	DEPTH_DESC = 'depth_desc',

	// Por actividad
	ACTIVITY_ASC = 'activity_asc',
	ACTIVITY_DESC = 'activity_desc',
}

/**
 * 📂 Alias para compatibilidad con código legacy
 */
export const FolderSortBy = FolderSortCriteria;

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
 * 📂 Modos de vista para carpetas
 */
export enum FolderViewMode {
	GRID = 'grid',
	LIST = 'list',
	TREE = 'tree',
	CARDS = 'cards',
}

/**
 * 📂 Niveles de calidad de organización
 */
export enum FolderQualityLevel {
	EXCELLENT = 'excellent', // A: 85-100
	GOOD = 'good', // B: 70-84
	FAIR = 'fair', // C: 50-69
	POOR = 'poor', // D: 0-49
}

/**
 * 📂 Estados de indexación
 */
export enum FolderIndexStatus {
	PENDING = 'pending',
	INDEXING = 'indexing',
	COMPLETED = 'completed',
	ERROR = 'error',
	NEVER = 'never',
}

/**
 * 📂 Tipos de contenido predominante
 */
export enum FolderContentType {
	MIXED = 'mixed',
	IMAGES = 'images',
	VIDEOS = 'videos',
	DOCUMENTS = 'documents',
	EMPTY = 'empty',
}
