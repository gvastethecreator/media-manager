/**
 * @file Tipos para Unified File Manager Store
 * @module store/unified-file-manager-types
 */

import type { ViewMode } from '@/store/ui.store';
import type { EntityWithStats } from '@/types/entities/entity.types';
import type { EntityStatsType } from '@/types/file-browser/entity-stats';
import type { OperationQueue } from './unified-file-manager-queue';

/**
 * Entidad base con propiedades comunes
 */
export interface BaseEntity {
	count: number;
	id: string;
	name: string;
}

/**
 * Entidad de colección con color y emoji
 */
export interface CollectionEntity extends BaseEntity {
	color?: string;
	emoji?: string;
}

/**
 * Entidad de etiqueta con color
 */
export interface TagEntity extends BaseEntity {
	color: string;
}

/**
 * Entidad con emoji (álbumes, personajes, lugares, items de mundo)
 */
export interface EntityWithEmoji extends BaseEntity {
	emoji: string;
}

/**
 * Tipo de contexto de navegación
 */
export type NavigationContext =
	| 'folder'
	| 'collection'
	| 'tag'
	| 'album'
	| 'character'
	| 'place'
	| 'world-item'
	| 'all'
	| null;

/**
 * Estado principal del Unified File Manager Store
 */
export interface UnifiedFileManagerState {
	albums: EntityWithEmoji[];
	characters: EntityWithEmoji[];
	clearSelection: () => void;

	// 📈 Metadatos
	collections: CollectionEntity[];
	currentAlbum: EntityWithEmoji | null;
	currentAlbumId: string | null;
	currentCharacter: EntityWithEmoji | null;
	currentCharacterId: string | null;
	currentCollection: CollectionEntity | null;
	currentCollectionId: string | null;

	// 🧭 Estado de navegación
	currentContext: NavigationContext;

	// 📊 Entidades actuales
	currentFolder: BaseEntity | null;
	currentFolderId: string | null;
	// 📂 Estado de items
	currentItems: EntityWithStats[];
	currentPage: number;
	currentPlace: EntityWithEmoji | null;
	currentPlaceId: string | null;
	currentTag: TagEntity | null;
	currentTagId: string | null;
	currentWorldItem: EntityWithEmoji | null;
	currentWorldItemId: string | null;
	deselectItem: (id: string) => void;
	displayedItems: EntityWithStats[];
	error: string | null;
	filterByType: (type: EntityStatsType) => EntityWithStats[];
	folders: BaseEntity[];
	getCacheStats: () => { size: number; maxSize: number; hitRate: number };
	getEntityStatistics: (entity: EntityWithStats) => any;

	// 🔄 Utilidades para EntityWithStats
	getEntityType: (entity: EntityWithStats) => EntityStatsType;

	// 📄 Estado de paginación
	hasMoreItems: boolean;

	// 🔄 Acciones principales
	initialize: () => Promise<void>;

	// 📊 Cache management
	invalidateCache: (key?: string) => void;
	isLoading: boolean;
	isLoadingMore: boolean;

	// ⚡ Estado de procesamiento
	isProcessingThumbnails: boolean;
	lastSelectedItem: EntityWithStats | null;
	lastUpdate: number;
	loadAllImages: () => Promise<void>;
	loadItems: (context: string, id?: string) => Promise<void>;
	loadMoreItems: () => void;
	operationQueue: OperationQueue;
	places: EntityWithEmoji[];
	refreshCurrentContext: () => Promise<void>;
	resetState: () => void;
	selectAll: () => void;

	// 🎯 Estado de selección
	selectedItem: EntityWithStats | null;
	selectedItems: EntityWithStats[];

	// 🎯 Selección
	selectItem: (item: EntityWithStats) => void;
	selectRange: (fromIndex: number, toIndex: number) => void;
	setCurrentAlbum: (id: string) => Promise<void>;
	setCurrentCharacter: (id: string) => Promise<void>;
	setCurrentCollection: (id: string) => Promise<void>;

	// 🧭 Navegación con cache
	setCurrentFolder: (id: string) => Promise<void>;
	setCurrentPlace: (id: string) => Promise<void>;
	setCurrentTag: (id: string) => Promise<void>;
	setCurrentWorldItem: (id: string) => Promise<void>;
	setIsLoading: (loading: boolean) => void;

	// 🛠️ Utilidades
	setViewMode: (mode: ViewMode) => void;
	tags: TagEntity[];
	toggleItemSelection: (item: EntityWithStats, isMultiSelect: boolean) => void;
	totalItems: number;

	// 🎨 Estado de vista
	viewMode: ViewMode;
	worldItems: EntityWithEmoji[];
}
