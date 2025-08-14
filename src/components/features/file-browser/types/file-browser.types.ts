/**
 * @file Tipos e interfaces para FileBrowser
 * @module components/features/file-browser/types/file-browser.types
 * @description Definiciones de tipos extraídas del FileBrowser para mejorar la organización
 */

import type { CardLayout, CardSize, CardVariant } from '@/components/cards/types/card-layout.types';
import { type AnyEntityWithStats, EntityStatsType } from '@/types/migration';

export interface FileBrowserProps {
	/** Tipo de entidad a mostrar - puede ser un tipo específico o 'mixed' para múltiples tipos */
	entityType?: EntityStatsType | 'mixed';
	/** Tipos de entidades específicas a mostrar cuando entityType es 'mixed' */
	entityTypes?: EntityStatsType[];
	/** Estado de carga (opcional) */
	isLoading?: boolean;
	/** Items específicos a mostrar (para modo manual) */
	items?: AnyEntityWithStats[];
	/** Callback cuando se selecciona un item */
	onItemSelect?: (item: AnyEntityWithStats) => void;
	/** Callback cuando se hace click en un item */
	onItemClick?: (item: AnyEntityWithStats, e: React.MouseEvent) => void;
	/** Callback cuando se hace doble click en un item */
	onItemDoubleClick?: (item: AnyEntityWithStats) => void;
	/** Clase CSS adicional */
	className?: string;
	/** ID de carpeta/colección/etc para filtrar */
	filterId?: string;
	/** Tipo de filtro (folder, collection, tag, etc) */
	filterType?: 'folder' | 'collection' | 'tag' | 'album' | 'video';
	/** IDs de elementos seleccionados */
	selectedIds?: string[];
	/** Modo de funcionamiento */
	mode?: 'auto' | 'manual';
	/** Nuevas props para layouts */
	layout?: CardLayout;
	/** Nuevas props para layouts */
	preset?: string;
	/** Nuevas props para layouts */
	variant?: CardVariant;
	/** Nuevas props para layouts */
	size?: CardSize;
}

export interface FileBrowserDataState {
	rawItems: AnyEntityWithStats[];
	filteredItems: AnyEntityWithStats[];
	items: AnyEntityWithStats[];
	isLoading: boolean;
	error: unknown;
}

export interface FileBrowserSelectionState {
	selectedIds: string[];
	focusedId: string | null;
	effectiveSelectedIds: string[];
}

export interface SortingValues {
	name: string;
	path: string;
	modifiedTime: number;
	createdTime: number;
}

export interface ViewProps {
	items: AnyEntityWithStats[];
	itemSize: number;
	selectedIds: string[];
	containerWidth: number;
	onItemClick: (item: AnyEntityWithStats, e: React.MouseEvent) => void;
	onItemDoubleClick: (item: AnyEntityWithStats) => void;
	onItemContextMenu: (e: React.MouseEvent, item: AnyEntityWithStats, selectedItems: AnyEntityWithStats[]) => void;
	onContextAction: (action: string, item: AnyEntityWithStats, data?: Record<string, unknown>) => void;
}

export interface FileItem {
	id: string;
	name: string;
	type: 'file';
	size: number;
	modifiedAt: Date;
	path: string;
	isDirectory: boolean;
	extension: string;
	mimeType: string;
}
