/**
 * 📦 Tipos para Unified File Manager Store
 */

import type { ViewMode } from '@/components/navigation/types';
import type { EntityWithStats } from '@/types/entities/entity.types';
import type { EntityStatsType } from '@/types/file-browser/entity-stats';
import type { OperationQueue } from '../utils/OperationQueue';

// 🏗️ Tipos de entidades base
export interface BaseEntity {
	id: string;
	name: string;
	count: number;
}

export interface CollectionEntity extends BaseEntity {
	color?: string;
	emoji?: string;
}

export interface TagEntity extends BaseEntity {
	color: string;
}

export interface EntityWithEmoji extends BaseEntity {
	emoji: string;
}

// 🧭 Tipos de contexto de navegación
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

// 📊 Estado del Unified File Manager
export interface UnifiedFileManagerState {
	// 📂 Estado de items - ACTUALIZADO
	currentItems: EntityWithStats[];
	displayedItems: EntityWithStats[];
	isLoading: boolean;
	error: string | null;
	lastUpdate: number;

	// 📄 Estado de paginación
	hasMoreItems: boolean;
	currentPage: number;
	totalItems: number;
	isLoadingMore: boolean;

	// 🎯 Estado de selección - ACTUALIZADO
	selectedItem: EntityWithStats | null;
	selectedItems: EntityWithStats[];
	lastSelectedItem: EntityWithStats | null;

	// 🧭 Estado de navegación
	currentContext: NavigationContext;
	currentFolderId: string | null;
	currentCollectionId: string | null;
	currentTagId: string | null;
	currentAlbumId: string | null;
	currentCharacterId: string | null;
	currentPlaceId: string | null;
	currentWorldItemId: string | null;

	// 📊 Entidades actuales
	currentFolder: BaseEntity | null;
	currentCollection: CollectionEntity | null;
	currentTag: TagEntity | null;
	currentAlbum: EntityWithEmoji | null;
	currentCharacter: EntityWithEmoji | null;
	currentPlace: EntityWithEmoji | null;
	currentWorldItem: EntityWithEmoji | null;

	// 📈 Metadatos
	collections: CollectionEntity[];
	folders: BaseEntity[];
	tags: TagEntity[];
	albums: EntityWithEmoji[];
	characters: EntityWithEmoji[];
	places: EntityWithEmoji[];
	worldItems: EntityWithEmoji[];

	// ⚡ Estado de procesamiento
	isProcessingThumbnails: boolean;
	operationQueue: OperationQueue;

	// 🎨 Estado de vista
	viewMode: ViewMode;

	// 🔄 Acciones principales
	initialize: () => Promise<void>;
	loadItems: (context: string, id?: string) => Promise<void>;
	loadMoreItems: () => void;

	// 🎯 Selección - ACTUALIZADO
	selectItem: (item: EntityWithStats) => void;
	deselectItem: (id: string) => void;
	toggleItemSelection: (item: EntityWithStats, isMultiSelect: boolean) => void;
	clearSelection: () => void;
	selectAll: () => void;
	selectRange: (fromIndex: number, toIndex: number) => void;

	// 🧭 Navegación con cache
	setCurrentFolder: (id: string) => Promise<void>;
	setCurrentCollection: (id: string) => Promise<void>;
	setCurrentTag: (id: string) => Promise<void>;
	setCurrentAlbum: (id: string) => Promise<void>;
	setCurrentCharacter: (id: string) => Promise<void>;
	setCurrentPlace: (id: string) => Promise<void>;
	setCurrentWorldItem: (id: string) => Promise<void>;
	loadAllImages: () => Promise<void>;

	// 🛠️ Utilidades
	setViewMode: (mode: ViewMode) => void;
	setIsLoading: (loading: boolean) => void;
	resetState: () => void;
	refreshCurrentContext: () => Promise<void>;

	// 📊 Cache management
	invalidateCache: (key?: string) => void;
	getCacheStats: () => { size: number; maxSize: number; hitRate: number };

	// 🔄 Nuevas utilidades para EntityWithStats
	getEntityType: (entity: EntityWithStats) => EntityStatsType;
	filterByType: (type: EntityStatsType) => EntityWithStats[];
	getEntityStatistics: (entity: EntityWithStats) => any;
}

// 📊 Configuración
export const ITEMS_PER_BATCH = 100;
export const DEBOUNCE_DELAY = 150;
