import type { NoteBase } from './base';
import type { NotePriority, NoteSortOption, NoteStatus, NoteViewMode } from './enums';

/**
 * Tipo para representar los tags de una nota como array
 */
export interface NoteTags {
	items: string[];
}

/**
 * Interfaz extendida para Notes con propiedades de UI y utilidades
 */
export interface NoteExtended extends NoteBase {
	// Propiedades UI
	isSelected?: boolean;
	isEditing?: boolean;
	isNew?: boolean;
	isExpanded?: boolean;
	isHovered?: boolean;

	// Propiedades calculadas
	parsedTags?: string[];
	formattedDate?: string;
	excerpt?: string;
	wordCount?: number;
	relationsCount?: number;
}

/**
 * Interfaz para filtros de notas
 */
export interface NoteFilters {
	search: string;
	category?: string;
	status?: NoteStatus;
	priority?: NotePriority;
	tags: string[];
	onlyFavorites: boolean;
	dateRange?: {
		from: Date | null;
		to: Date | null;
	};
}

/**
 * Interfaz para las opciones de visualización de notas
 */
export interface NoteViewOptions {
	mode: NoteViewMode;
	sortBy: NoteSortOption;
	showPreview: boolean;
	showMetadata: boolean;
	expandContent: boolean;
	groupByCategory: boolean;
	groupByStatus: boolean;
}

/**
 * Interfaz para columnas personalizables en vista de lista
 */
export interface NoteListColumn {
	id: string;
	label: string;
	accessor: keyof NoteExtended | string;
	visible: boolean;
	width?: number;
	sortable?: boolean;
	filterable?: boolean;
}
