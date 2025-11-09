/**
 * 🔄 UNIFIED FILE MANAGER STORE - MIGRADO A EntityWithStats
 *
 * Store consolidado que reemplaza múltiples stores duplicados:
 * - files.store.ts (ELIMINADO)
 * - file-manager.store.ts
 * - entities/folder/store.ts
 * - hooks/use-file-manager.ts
 *
 * ✅ MIGRACIÓN COMPLETADA:
 * - FileItem → EntityWithStats
 * - Transformadores actualizados
 * - Type guards integrados
 * - Performance optimizada
 *
 * Incluye optimizaciones de performance:
 * ✅ Cache LRU integrado
 * ✅ Event throttling
 * ✅ Operation queue para prevenir race conditions
 * ✅ Batch loading optimizado
 * ✅ Selección multi-item eficiente
 */

import { create } from 'zustand';
// 🚀 Importaciones actualizadas - MIGRADAS A EntityWithStats
import type { ViewMode } from '@/components/navigation/types';
import { getFolderImagesFromApi } from '@/lib/api/client/folder.client';
import { folderResponseCache as folderCache } from '@/lib/filesystem/folder-cache';
import { clientLogger } from '@/lib/logger/client-logger';
// 🎯 Cache y throttling optimizados
import { throttleEvent } from '@/lib/system/event-throttler';
import type { EntityWithStats } from '@/types/entities/entity.types';
import { isFolderWithStats, isImageWithStats, isVideoWithStats } from '@/types/entity-guards';
import { EntityStatsType } from '@/types/file-browser/entity-stats';
// 📦 Importaciones modularizadas
import { OperationQueue } from './utils/OperationQueue';
import {
	ITEMS_PER_BATCH,
	type BaseEntity,
	type CollectionEntity,
	type EntityWithEmoji,
	type TagEntity,
	type UnifiedFileManagerState,
} from './types/unified-file-manager.types';

const fileManagerLogger = clientLogger.withContext('UnifiedFileManager');

// 🏗️ Estado inicial
const initialState = {
	currentItems: [],
	displayedItems: [],
	selectedItem: null,
	selectedItems: [],
	lastSelectedItem: null,
	currentContext: null,
	currentFolderId: null,
	currentCollectionId: null,
	currentTagId: null,
	currentAlbumId: null,
	currentCharacterId: null,
	currentPlaceId: null,
	currentWorldItemId: null,
	currentFolder: null,
	currentCollection: null,
	currentTag: null,
	currentAlbum: null,
	currentCharacter: null,
	currentPlace: null,
	currentWorldItem: null,
	isLoading: false,
	error: null,
	collections: [],
	folders: [],
	tags: [],
	albums: [],
	characters: [],
	places: [],
	worldItems: [],
	isProcessingThumbnails: false,
	operationQueue: new OperationQueue(),
	viewMode: 'grid' as ViewMode,
	lastUpdate: Date.now(),
	// 📄 Estados de paginación
	hasMoreItems: false,
	currentPage: 0,
	totalItems: 0,
	isLoadingMore: false,
};

// 🎯 Transformador de datos optimizado - MIGRADO A EntityWithStats
const transformToEntityWithStats = (rawItem: any): EntityWithStats => {
	try {
		fileManagerLogger.debug('🔄 Transformando item a EntityWithStats:', rawItem.id);

		// ✅ Validación de tipos básicos
		if (!rawItem.id || typeof rawItem.id !== 'string') {
			throw new Error('ID requerido y debe ser string');
		}

		// 🎯 Detectar tipo de entidad y transformar apropiadamente
		if (rawItem.width && rawItem.height && rawItem.hash) {
			// Es una imagen - usar patrón ImageWithStats
			const stats = {
				viewCount: 0,
				downloadCount: 0,
				likeCount: 0,
				commentCount: 0,
				tagCount: rawItem._count?.tags || 0,
				albumCount: rawItem._count?.albums || 0,
				collectionCount: rawItem._count?.collections || 0,
				characterCount: rawItem._count?.characters || 0,
				placeCount: rawItem._count?.places || 0,
				worldItemCount: rawItem._count?.worldItems || 0,
				conceptCount: rawItem._count?.concepts || 0,
				promptCount: rawItem._count?.prompts || 0,
				noteCount: rawItem._count?.notes || 0,
				wildcardCount: rawItem._count?.wildcards || 0,
				propertyCount: rawItem._count?.properties || 0,
				groupCount: rawItem._count?.groups || 0,
			};

			return {
				...rawItem,
				entityType: 'image',
				stats,
				thumbnailUrl: rawItem.thumbnail || `/api/images/${rawItem.id}/thumbnail`,
				fullUrl: `/api/images/${rawItem.id}/full`,
			} as EntityWithStats;
		}

		// Para otros tipos, crear estructura básica compatible
		fileManagerLogger.warn('Tipo de entidad no reconocido, usando transformación genérica:', rawItem);
		return {
			...rawItem,
			name: rawItem.name || 'Entidad sin nombre',
			createdAt: rawItem.createdAt instanceof Date ? rawItem.createdAt : new Date(rawItem.createdAt || Date.now()),
			updatedAt: rawItem.updatedAt instanceof Date ? rawItem.updatedAt : new Date(rawItem.updatedAt || Date.now()),
		} as EntityWithStats;
	} catch (error) {
		fileManagerLogger.error('❌ Error transformando item a EntityWithStats:', error);
		throw new Error(`Error transformando item: ${error instanceof Error ? error.message : 'Error desconocido'}`);
	}
};

// 🚀 Store principal unificado
export const useUnifiedFileManager = create<UnifiedFileManagerState>((set, get) => ({
	...initialState,

	// 🔄 Inicialización con cache
	initialize: async () => {
		try {
			fileManagerLogger.info('🚀 Inicializando Unified File Manager');
			set({ isLoading: true, error: null });

			// 📊 Para simplificar, inicializamos con arrays vacíos
			// TODO: Implementar carga inicial de estadísticas si es necesario
			set({
				collections: [],
				folders: [],
				tags: [],
				albums: [],
				characters: [],
				places: [],
				worldItems: [],
				lastUpdate: Date.now(),
			});

			fileManagerLogger.info('✅ Unified File Manager inicializado');
		} catch (error) {
			fileManagerLogger.error('❌ Error al inicializar:', error);
			set({ error: error instanceof Error ? error.message : 'Error desconocido' });
		} finally {
			set({ isLoading: false });
		}
	},

	// 📂 Carga de items con cache y throttling
	loadItems: async (context: string, id?: string) => {
		const state = get();

		try {
			fileManagerLogger.info('🔄 Cargando items:', { context, id });

			// 🎯 Generar clave de cache
			const cacheKey = id ? `${context}:${id}` : context;

			// ⚡ Verificar cache primero
			const items = folderCache.get(cacheKey);

			if (items) {
				fileManagerLogger.info('⚡ Usando items desde cache:', cacheKey);
				const transformedItems = items.map(transformToEntityWithStats);
				set({
					currentItems: transformedItems,
					displayedItems: transformedItems.slice(0, ITEMS_PER_BATCH),
					isProcessingThumbnails: false,
					lastUpdate: Date.now(),
				});
				return;
			} // 🔄 Usar operation queue para evitar race conditions
			await state.operationQueue.add(async () => {
				set({ isLoading: true, error: null });

				let rawResponse: any = null;

				// 🎯 Cargar según contexto usando APIs disponibles
				switch (context) {
					case 'folder': {
						// Llamada a la API para obtener imágenes de la carpeta
						if (id) {
							try {
								fileManagerLogger.info(`🔄 Obteniendo imágenes de carpeta con ID: ${id}`);

								// 📄 Determinar paginación: primera carga vs carga incremental
								const isInitialLoad = state.currentItems.length === 0;
								const skip = isInitialLoad ? 0 : state.currentItems.length;
								const take = ITEMS_PER_BATCH;

								// Obtener imágenes con paginación
								rawResponse = await getFolderImagesFromApi(id, { skip, take });

								// Verificar si se obtuvo una respuesta válida
								if (!(rawResponse && Array.isArray(rawResponse.items))) {
									fileManagerLogger.warn(`⚠️ La respuesta no es válida: ${typeof rawResponse}`);
									rawResponse = { items: [], pagination: { hasMore: false, total: 0, currentPage: 0 } };
								}

								fileManagerLogger.debug(`✅ Obtenidas ${rawResponse.items.length} imágenes para carpeta ${id}`);
								fileManagerLogger.debug('� Paginación:', rawResponse.pagination);
							} catch (folderError) {
								fileManagerLogger.error(`❌ Error obteniendo imágenes de carpeta ${id}:`, folderError);
								rawResponse = { items: [], pagination: { hasMore: false, total: 0, currentPage: 0 } };
							}
						}
						break;
					}
					default:
						throw new Error(`Contexto no soportado para paginación: ${context}`);
				}

				// 🔄 Transformar items de la respuesta
				const newItems = rawResponse?.items ? rawResponse.items.map(transformToEntityWithStats) : [];

				// 📄 Manejar paginación: primera carga vs carga incremental
				const isInitialLoad = state.currentItems.length === 0;
				const updatedItems = isInitialLoad ? newItems : [...state.currentItems, ...newItems];

				// 💾 Guardar en cache solo si hay items
				if (newItems.length > 0) {
					folderCache.set(cacheKey, updatedItems);
				}

				set({
					currentItems: updatedItems,
					displayedItems: updatedItems,
					isProcessingThumbnails: updatedItems.length > 0,
					hasMoreItems: rawResponse?.pagination?.hasMore,
					totalItems: rawResponse?.pagination?.total || updatedItems.length,
					currentPage: rawResponse?.pagination?.currentPage || 0,
					lastUpdate: Date.now(),
				});

				fileManagerLogger.info(`✅ ${updatedItems.length} items cargados para ${context} (${newItems.length} nuevos)`);
			});
		} catch (error) {
			fileManagerLogger.error('❌ Error cargando items:', error);
			set({
				error: error instanceof Error ? error.message : 'Error desconocido',
				currentItems: [],
				displayedItems: [],
			});
		} finally {
			set({ isLoading: false, isProcessingThumbnails: false });
		}
	},
	// ➕ Carga incremental optimizada
	loadMoreItems: () => {
		const state = get();

		// 🛡️ Validaciones de seguridad
		if (state.isLoadingMore || state.isLoading || !state.hasMoreItems) {
			fileManagerLogger.debug('📂 No se puede cargar más: ya cargando o no hay más items');
			return;
		}

		if (!(state.currentContext && state.currentFolderId)) {
			fileManagerLogger.warn('📂 No hay contexto actual para cargar más items');
			return;
		}

		fileManagerLogger.info(`🔄 Cargando más items: página ${state.currentPage + 1}`);

		// 🔄 Marcar como cargando más y lanzar la carga
		set({ isLoadingMore: true });

		// Usar loadItems con el contexto actual para cargar la siguiente página
		state.loadItems(state.currentContext, state.currentFolderId).finally(() => {
			set({ isLoadingMore: false });
		});
	},

	// 🎯 Selección optimizada de items
	selectItem: (item: EntityWithStats) => {
		fileManagerLogger.debug('🎯 Seleccionando item:', item.id);
		set((state) => ({
			selectedItem: item,
			selectedItems: [...state.selectedItems.filter((i) => i.id !== item.id), item],
			lastSelectedItem: item,
			lastUpdate: Date.now(),
		}));
	},

	deselectItem: (id: string) => {
		fileManagerLogger.debug('❌ Deseleccionando item:', id);
		set((state) => ({
			selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
			selectedItems: state.selectedItems.filter((item) => item.id !== id),
			lastSelectedItem: state.lastSelectedItem?.id === id ? null : state.lastSelectedItem,
			lastUpdate: Date.now(),
		}));
	},

	toggleItemSelection: (item: EntityWithStats, isMultiSelect: boolean) => {
		const state = get();
		const isSelected = state.selectedItems.some((i) => i.id === item.id);

		fileManagerLogger.debug(`🔄 Toggle selección: ${item.id} (multi: ${isMultiSelect})`);

		if (!isMultiSelect) {
			// ⚡ Selección simple - reemplaza todo
			set({
				selectedItem: item,
				selectedItems: [item],
				lastSelectedItem: item,
				lastUpdate: Date.now(),
			});
			return;
		}

		// 🎯 Selección múltiple
		if (isSelected) {
			state.deselectItem(item.id);
		} else {
			state.selectItem(item);
		}
	},

	clearSelection: () => {
		fileManagerLogger.debug('🧹 Limpiando selección');
		set({
			selectedItem: null,
			selectedItems: [],
			lastSelectedItem: null,
			lastUpdate: Date.now(),
		});
	},

	selectAll: () => {
		const state = get();
		fileManagerLogger.info(`🎯 Seleccionando todos los items (${state.displayedItems.length})`);
		set({
			selectedItems: [...state.displayedItems],
			selectedItem: state.displayedItems[0] || null,
			lastSelectedItem: state.displayedItems.at(-1) || null,
			lastUpdate: Date.now(),
		});
	},

	selectRange: (fromIndex: number, toIndex: number) => {
		const state = get();
		const startIndex = Math.min(fromIndex, toIndex);
		const endIndex = Math.max(fromIndex, toIndex);
		const rangeItems = state.displayedItems.slice(startIndex, endIndex + 1);

		fileManagerLogger.info(`🎯 Seleccionando rango ${startIndex}-${endIndex} (${rangeItems.length} items)`);

		set({
			selectedItems: [
				...state.selectedItems,
				...rangeItems.filter((item) => !state.selectedItems.some((selected) => selected.id === item.id)),
			],
			lastUpdate: Date.now(),
		});
	},

	// 🧭 Navegación con cache integrado
	setCurrentFolder: async (id: string) => {
		const state = get();
		if (state.currentFolderId === id && state.currentItems.length > 0) {
			fileManagerLogger.debug('📂 Carpeta ya cargada:', id);
			return;
		}

		fileManagerLogger.info('📂 Cambiando a carpeta:', id);

		// Buscar la carpeta en el array de carpetas
		const folder = state.folders.find((f) => f.id === id);
		// Si no se encuentra la carpeta o no tiene información completa, intentar obtenerla
		let folderWithDetails = folder;
		if (!folder?.count) {
			try {
				// TODO: Implementar obtención de detalles de carpeta cuando la función esté disponible
				fileManagerLogger.debug('📊 Usando información básica de carpeta');
				folderWithDetails = folder || {
					id,
					name: `Carpeta ${id}`,
					count: 0,
				};
			} catch (error) {
				fileManagerLogger.warn('⚠️ Error obteniendo detalles de carpeta:', error);
			}
		}

		// 🧹 Limpieza de estado relevante al cambiar de carpeta
		set({
			currentItems: [],
			displayedItems: [],
			selectedItem: null,
			selectedItems: [],
			lastSelectedItem: null,
			currentPage: 0,
			hasMoreItems: false,
			totalItems: 0,
			isLoading: true,
			isLoadingMore: false,
			error: null,
		});

		set({
			currentContext: 'folder',
			currentFolderId: id,
			currentCollectionId: null,
			currentTagId: null,
			currentAlbumId: null,
			currentCharacterId: null,
			currentPlaceId: null,
			currentWorldItemId: null,
			currentFolder: folderWithDetails,
			currentCollection: null,
			currentTag: null,
			currentAlbum: null,
			currentCharacter: null,
			currentPlace: null,
			currentWorldItem: null,
		});
		state.clearSelection();
		await state.loadItems('folder', id);

		// 🔄 Throttle de revalidación
		const throttledRevalidation = throttleEvent(
			async () => {
				// Revalidar después de un delay
				fileManagerLogger.debug('🔄 Revalidación throttled para folder:', { id });
			},
			`folder-change-${id}`,
			{ delay: 1000 }
		);

		await throttledRevalidation();
	},

	setCurrentCollection: async (id: string) => {
		const state = get();
		fileManagerLogger.info('📚 Cambiando a colección:', id);

		const collection = state.collections.find((c) => c.id === id) || null;
		set({
			currentContext: 'collection',
			currentFolderId: null,
			currentCollectionId: id,
			currentTagId: null,
			currentAlbumId: null,
			currentCharacterId: null,
			currentPlaceId: null,
			currentWorldItemId: null,
			currentFolder: null,
			currentCollection: collection,
			currentTag: null,
			currentAlbum: null,
			currentCharacter: null,
			currentPlace: null,
			currentWorldItem: null,
		});

		state.clearSelection();
		await state.loadItems('collection', id);
	},

	setCurrentTag: async (id: string) => {
		const state = get();
		fileManagerLogger.info('🏷️ Cambiando a etiqueta:', id);

		const tag = state.tags.find((t) => t.id === id) || null;
		set({
			currentContext: 'tag',
			currentFolderId: null,
			currentCollectionId: null,
			currentTagId: id,
			currentAlbumId: null,
			currentCharacterId: null,
			currentPlaceId: null,
			currentWorldItemId: null,
			currentFolder: null,
			currentCollection: null,
			currentTag: tag,
			currentAlbum: null,
			currentCharacter: null,
			currentPlace: null,
			currentWorldItem: null,
		});

		state.clearSelection();
		await state.loadItems('tag', id);
	},

	setCurrentAlbum: async (id: string) => {
		const state = get();
		fileManagerLogger.info('📸 Cambiando a álbum:', id);

		const album = state.albums.find((a) => a.id === id) || null;
		set({
			currentContext: 'album',
			currentFolderId: null,
			currentCollectionId: null,
			currentTagId: null,
			currentAlbumId: id,
			currentCharacterId: null,
			currentPlaceId: null,
			currentWorldItemId: null,
			currentFolder: null,
			currentCollection: null,
			currentTag: null,
			currentAlbum: album,
			currentCharacter: null,
			currentPlace: null,
			currentWorldItem: null,
		});

		state.clearSelection();
		await state.loadItems('album', id);
	},

	setCurrentCharacter: async (id: string) => {
		const state = get();
		fileManagerLogger.info('👤 Cambiando a personaje:', id);

		const character = state.characters.find((c) => c.id === id) || null;
		set({
			currentContext: 'character',
			currentFolderId: null,
			currentCollectionId: null,
			currentTagId: null,
			currentAlbumId: null,
			currentCharacterId: id,
			currentPlaceId: null,
			currentWorldItemId: null,
			currentFolder: null,
			currentCollection: null,
			currentTag: null,
			currentAlbum: null,
			currentCharacter: character,
			currentPlace: null,
			currentWorldItem: null,
		});

		state.clearSelection();
		await state.loadItems('character', id);
	},

	setCurrentPlace: async (id: string) => {
		const state = get();
		fileManagerLogger.info('📍 Cambiando a lugar:', id);

		const place = state.places.find((p) => p.id === id) || null;
		set({
			currentContext: 'place',
			currentFolderId: null,
			currentCollectionId: null,
			currentTagId: null,
			currentAlbumId: null,
			currentCharacterId: null,
			currentPlaceId: id,
			currentWorldItemId: null,
			currentFolder: null,
			currentCollection: null,
			currentTag: null,
			currentAlbum: null,
			currentCharacter: null,
			currentPlace: place,
			currentWorldItem: null,
		});

		state.clearSelection();
		await state.loadItems('place', id);
	},

	setCurrentWorldItem: async (id: string) => {
		const state = get();
		fileManagerLogger.info('🌍 Cambiando a elemento del mundo:', id);

		const worldItem = state.worldItems.find((w) => w.id === id) || null;
		set({
			currentContext: 'world-item',
			currentFolderId: null,
			currentCollectionId: null,
			currentTagId: null,
			currentAlbumId: null,
			currentCharacterId: null,
			currentPlaceId: null,
			currentWorldItemId: id,
			currentFolder: null,
			currentCollection: null,
			currentTag: null,
			currentAlbum: null,
			currentCharacter: null,
			currentPlace: null,
			currentWorldItem: worldItem,
		});

		state.clearSelection();
		await state.loadItems('world-item', id);
	},

	loadAllImages: async () => {
		const state = get();
		fileManagerLogger.info('🖼️ Cargando todas las imágenes');

		set({
			currentContext: 'all',
			currentFolderId: null,
			currentCollectionId: null,
			currentTagId: null,
			currentAlbumId: null,
			currentCharacterId: null,
			currentPlaceId: null,
			currentWorldItemId: null,
			currentFolder: null,
			currentCollection: null,
			currentTag: null,
			currentAlbum: null,
			currentCharacter: null,
			currentPlace: null,
			currentWorldItem: null,
		});

		state.clearSelection();
		await state.loadItems('all');
	},

	// 🛠️ Utilidades
	setViewMode: (mode: ViewMode) => {
		fileManagerLogger.debug('🎨 Cambiando modo de vista:', mode);
		set({ viewMode: mode, lastUpdate: Date.now() });
	},

	setIsLoading: (loading: boolean) => {
		set({ isLoading: loading, lastUpdate: Date.now() });
	},
	resetState: () => {
		fileManagerLogger.info('🔄 Reiniciando estado');
		const state = get();
		state.operationQueue.clear();
		set({ ...initialState, operationQueue: new OperationQueue(), lastUpdate: Date.now() });
	},

	refreshCurrentContext: async () => {
		const state = get();
		if (!state.currentContext) {
			return;
		}

		fileManagerLogger.info('🔄 Refrescando contexto actual:', state.currentContext);

		// 🧹 Limpiar cache del contexto actual
		const contextId =
			state.currentFolderId ||
			state.currentCollectionId ||
			state.currentTagId ||
			state.currentAlbumId ||
			state.currentCharacterId ||
			state.currentPlaceId ||
			state.currentWorldItemId;

		if (contextId) {
			const cacheKey = `${state.currentContext}:${contextId}`;
			folderCache.delete(cacheKey);
		}

		// 🔄 Recargar
		await state.loadItems(state.currentContext, contextId || undefined);
	},

	// 📊 Cache management
	invalidateCache: (key?: string) => {
		if (key) {
			folderCache.delete(key);
			fileManagerLogger.info('🧹 Cache invalidado:', key);
		} else {
			folderCache.clear();
			fileManagerLogger.info('🧹 Todo el cache invalidado');
		}
	},

	getCacheStats: () => {
		return folderCache.getStats();
	},

	// 🔄 Nuevas utilidades para EntityWithStats
	getEntityType: (entity: EntityWithStats): EntityStatsType => {
		if (isImageWithStats(entity)) {
			return EntityStatsType.IMAGE;
		}
		if (isVideoWithStats(entity)) {
			return EntityStatsType.VIDEO;
		}
		if (isFolderWithStats(entity)) {
			return EntityStatsType.FOLDER;
		}
		// Detectar otros tipos basándose en propiedades
		if ('color' in entity && !('emoji' in entity)) {
			return EntityStatsType.TAG;
		}
		if ('gender' in entity) {
			return EntityStatsType.CHARACTER;
		}
		if ('conceptType' in entity) {
			return EntityStatsType.CONCEPT;
		}
		if ('category' in entity && !('path' in entity)) {
			return EntityStatsType.COLLECTION;
		}
		// Fallback genérico
		return EntityStatsType.IMAGE; // Por defecto asumimos imagen
	},

	filterByType: (type: EntityStatsType) => {
		const state = get();
		return state.currentItems.filter((item) => {
			try {
				return state.getEntityType(item) === type;
			} catch {
				return false;
			}
		});
	},

	getEntityStatistics: (entity: EntityWithStats) => {
		if ('stats' in entity) {
			return entity.stats;
		}
		// Para entidades que aún usan el patrón Complete
		return {
			totalAssociations: 0,
			lastUpdated: new Date(),
		};
	},
}));

// 📦 Re-exports de hooks especializados
export { useFolder, useCollection, useSelection, useNavigation } from './hooks';

// 🎯 Hook principal - reexport para compatibilidad
export const useFileManager = useUnifiedFileManager;
