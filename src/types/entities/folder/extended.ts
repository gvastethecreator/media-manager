import type { FolderBase, FolderVisualConfigBase } from './base';

/**
 * Tipo extendido para Folder con propiedades adicionales para la UI
 */
export interface FolderExtended extends FolderBase {
	// Propiedades calculadas
	totalFiles?: number;
	totalSize?: number;
	imageCount?: number;
	lastIndexed?: Date | string;

	// Propiedades UI
	isSelected?: boolean;
	isOpen?: boolean;
	level?: number;
	children?: FolderExtended[];

	// Propiedades visuales
	visualConfig?: FolderVisualConfigExtended;

	// Estado del cliente
	isLoading?: boolean;
	hasError?: boolean;
	errorMessage?: string;
}

/**
 * Tipo extendido para FolderVisualConfig con propiedades adicionales para la UI
 */
export interface FolderVisualConfigExtended extends FolderVisualConfigBase {
	// Propiedades de previsualización
	previewMode?: 'default' | 'compact' | 'grid' | 'carousel';

	// Propiedades UI
	isActive?: boolean;

	// Propiedades adicionales para efectos visuales
	effectsEnabled?: boolean;
	customClasses?: string;
}

/**
 * Tipo para carpetas en árbol de navegación
 */
export interface FolderTreeItem extends Pick<FolderExtended, 'id' | 'name' | 'path' | 'parentId' | 'emoji' | 'color'> {
	children: FolderTreeItem[];
	level: number;
	isOpen: boolean;
	isSelected: boolean;
	hasChildren: boolean;
	totalItems?: number;
}

/**
 * Tipo para vista expandida de Folder con relaciones
 */
export interface FolderWithRelations extends FolderExtended {
	parent?: FolderExtended | null;
	children: FolderExtended[];
	// Otros posibles campos de relaciones como imágenes destacadas, etc.
}

/**
 * Estado de la carpeta en la UI
 */
export interface FolderUIState {
	isExpanded: boolean;
	isSelected: boolean;
	isHovered: boolean;
	isDragging: boolean;
	isDropTarget: boolean;
	viewMode: 'list' | 'grid' | 'details';
	sortBy: 'name' | 'date' | 'size';
	sortDirection: 'asc' | 'desc';
}
