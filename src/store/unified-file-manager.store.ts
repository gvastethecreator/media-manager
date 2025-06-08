/**
 * 🔄 UNIFIED FILE MANAGER STORE
 *
 * Store consolidado que reemplaza múltiples stores duplicados:
 * - files.store.ts
 * - file-manager.store.ts
 * - entities/folder/store.ts
 * - hooks/use-file-manager.ts
 *
 * Incluye optimizaciones de performance:
 * ✅ Cache LRU integrado
 * ✅ Event throttling
 * ✅ Operation queue para prevenir race conditions
 * ✅ Batch loading optimizado
 * ✅ Selección multi-item eficiente
 */

import type { ViewMode } from '@/components/navigation/types';
import { clientLogger } from '@/lib/logger/client-logger';
import type { FileItem } from '@/types/file-item';
import { create } from 'zustand';

import { getAlbumImages } from '@/app/actions/albums/album.actions';
import { getCharacterImages } from '@/app/actions/characters/character.actions';
import { getFavorites } from '@/app/actions/favorites/favorite.actions';
import { getFolderImages } from '@/app/actions/folders';
import { getCollectionImages } from '@/app/actions/collections';
import { getImages } from '@/app/actions/images/image-crud.actions';
// 🚀 Importaciones de acciones optimizadas - CORREGIDAS
import { getTagImages } from '@/app/actions/tags/query.actions';
import { getWorldItemImages } from '@/app/actions/world-items/world-item.actions';

// 🎯 Cache y throttling optimizados
import { throttleEvent } from '@/lib/event-throttler';
import { folderResponseCache as folderCache } from '@/lib/folder-cache';

const fileManagerLogger = clientLogger.withContext('UnifiedFileManager');

// 📊 Constantes de configuración
const ITEMS_PER_BATCH = 100; // 🚀 Aumentado de 50 para mejor performance
const DEBOUNCE_DELAY = 150; // ⚡ Optimizado para responsividad
const MAX_OPERATION_QUEUE = 10; // 🔄 Límite de operaciones concurrentes

// 🏗️ Tipos de entidades
interface BaseEntity {
	id: string;
	name: string;
	count: number;
}

interface CollectionEntity extends BaseEntity {
	color?: string;
	emoji?: string;
}

interface TagEntity extends BaseEntity {
	color: string;
}

interface EntityWithEmoji extends BaseEntity {
	emoji: string;
}

// 🎯 Operation Queue para prevenir race conditions
class OperationQueue {
	private queue: Array<() => Promise<any>> = [];
	private isProcessing = false;
	private maxSize = MAX_OPERATION_QUEUE;

	async add<T>(operation: () => Promise<T>): Promise<T> {
		return new Promise((resolve, reject) => {
			if (this.queue.length >= this.maxSize) {
				fileManagerLogger.warn('🚨 Operation queue full, dropping oldest operation');
				this.queue.shift();
			}

			this.queue.push(async () => {
				try {
					const result = await operation();
					resolve(result);
				} catch (error) {
					reject(error);
				}
			});

			this.processQueue();
		});
	}

	private async processQueue() {
		if (this.isProcessing || this.queue.length === 0) return;

		this.isProcessing = true;

		while (this.queue.length > 0) {
			const operation = this.queue.shift();
			if (operation) {
				try {
					await operation();
				} catch (error) {
					fileManagerLogger.error('❌ Operation failed:', error);
				}
			}
		}

		this.isProcessing = false;
	}

	clear() {
		this.queue = [];
		this.isProcessing = false;
	}

	get length() {
		return this.queue.length;
	}

	get processing() {
		return this.isProcessing;
	}
}

// 🎯 Estado principal del store
interface UnifiedFileManagerState {
	// 📂 Estado de items
	currentItems: FileItem[];
	displayedItems: FileItem[];
	isLoading: boolean;
	error: string | null;
	lastUpdate: number;

	// 🎯 Estado de selección
	selectedItem: FileItem | null;
	selectedItems: FileItem[];
	lastSelectedItem: FileItem | null;

	// 🧭 Estado de navegación
	currentContext: 'folder' | 'collection' | 'tag' | 'album' | 'character' | 'place' | 'worldItem' | 'all' | null;
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

	// 🎯 Selección
	selectItem: (item: FileItem) => void;
	deselectItem: (id: string) => void;
	toggleItemSelection: (item: FileItem, isMultiSelect: boolean) => void;
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
}

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
};

// 🎯 Transformador de datos optimizado
const transformToFileItem = (rawItem: any): FileItem => {
	try {
		fileManagerLogger.debug('🔄 Transformando item:', rawItem.id);

		// ✅ Validación de tipos básicos
		if (!rawItem.id || typeof rawItem.id !== 'string') {
			throw new Error('ID requerido y debe ser string');
		}

		// 🎯 Transformación optimizada
		const fileItem: FileItem = {
			id: rawItem.id,
			name: rawItem.name || 'Archivo sin nombre',
			path: rawItem.path || '',
			type: rawItem.type === 'image' || rawItem.type === 'file' || rawItem.type === 'folder' ? rawItem.type : 'file',
			size: rawItem.size || 0,
			width: rawItem.width || null,
			height: rawItem.height || null,
			metadata:
				typeof rawItem.metadata === 'string'
					? rawItem.metadata
					: rawItem.metadata
						? JSON.stringify(rawItem.metadata)
						: null,
			thumbnail: typeof rawItem.thumbnail === 'string' ? rawItem.thumbnail : null,
			thumbnailSize: rawItem.thumbnailSize || null,
			thumbnailWidth: rawItem.thumbnailWidth || null,
			thumbnailHeight: rawItem.thumbnailHeight || null,
			isPublic: rawItem.isPublic || false,
			isFavorite: rawItem.isFavorite || false,
			folderId: rawItem.folderId || '',
			createdAt: rawItem.createdAt instanceof Date ? rawItem.createdAt : new Date(rawItem.createdAt),
			updatedAt: rawItem.updatedAt instanceof Date ? rawItem.updatedAt : new Date(rawItem.updatedAt),
			modifiedAt: rawItem.updatedAt instanceof Date ? rawItem.updatedAt : new Date(rawItem.updatedAt),
			accessedAt: rawItem.updatedAt instanceof Date ? rawItem.updatedAt : new Date(rawItem.updatedAt),

			// 🏷️ Relaciones optimizadas
			collections: Array.isArray(rawItem.collections)
				? rawItem.collections.map((c: any) =>
						typeof c === 'string' ? { id: c, name: c } : { id: c.id, name: c.name || c.id }
					)
				: [],
			tags: Array.isArray(rawItem.tags)
				? rawItem.tags.map((t: any) =>
						typeof t === 'string'
							? { id: t, name: t, color: '#94a3b8' }
							: { id: t.id, name: t.name || t.id, color: t.color || '#94a3b8' }
					)
				: [],
			albums: Array.isArray(rawItem.albums)
				? rawItem.albums.map((a: any) =>
						typeof a === 'string' ? { id: a, name: a } : { id: a.id, name: a.name || a.id }
					)
				: [],
			characters: Array.isArray(rawItem.characters)
				? rawItem.characters.map((c: any) =>
						typeof c === 'string' ? { id: c, name: c } : { id: c.id, name: c.name || c.id }
					)
				: [],
			places: Array.isArray(rawItem.places)
				? rawItem.places.map((p: any) =>
						typeof p === 'string' ? { id: p, name: p } : { id: p.id, name: p.name || p.id }
					)
				: [],
			worldItems: Array.isArray(rawItem.worldItems)
				? rawItem.worldItems.map((w: any) =>
						typeof w === 'string' ? { id: w, name: w } : { id: w.id, name: w.name || w.id }
					)
				: [],

			hash: rawItem.hash || '',
			stats: rawItem.stats || null,
		};

		return fileItem;
	} catch (error) {
		fileManagerLogger.error('❌ Error transformando item:', error);
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

			// 📊 Cargar estadísticas con cache
			const cacheKey = 'stats:all';
			let stats = folderCache.get(cacheKey);
			if (!stats) {
				fileManagerLogger.info('📊 Cargando estadísticas desde servidor');
				stats = await getStats();
				folderCache.set(cacheKey, stats);
			} else {
				fileManagerLogger.info('📊 Usando estadísticas desde cache');
			}

			// 🛡️ Validar stats con tipo seguro
			const safeStats = stats as any;

			set({
				collections: Array.isArray(safeStats?.collections) ? safeStats.collections : [],
				folders: Array.isArray(safeStats?.folders) ? safeStats.folders : [],
				tags: Array.isArray(safeStats?.tags) ? safeStats.tags : [],
				albums: Array.isArray(safeStats?.albums) ? safeStats.albums : [],
				characters: Array.isArray(safeStats?.characters) ? safeStats.characters : [],
				places: Array.isArray(safeStats?.places) ? safeStats.places : [],
				worldItems: Array.isArray(safeStats?.worldItems) ? safeStats.worldItems : [],
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
				const transformedItems = items.map(transformToFileItem);
				set({
					currentItems: transformedItems,
					displayedItems: transformedItems.slice(0, ITEMS_PER_BATCH),
					isProcessingThumbnails: false,
					lastUpdate: Date.now(),
				});
				return;
			}

			// 🔄 Usar operation queue para evitar race conditions
			await state.operationQueue.add(async () => {
				set({ isLoading: true, error: null });

				let rawItems: any[] = []; // 🎯 Cargar según contexto usando APIs disponibles
				switch (context) {
					case 'folder': {
						// Usar la función server action getFolderImages en lugar del fetch
						if (id) {
							try {
								fileManagerLogger.info(`🔄 Obteniendo imágenes de carpeta con ID: ${id}`);

								// Intentar obtener imágenes con la acción del servidor
								rawItems = await getFolderImages(id);

								// Verificar si se obtuvo una respuesta válida
								if (!Array.isArray(rawItems)) {
									fileManagerLogger.warn(`⚠️ La respuesta no es un array: ${typeof rawItems}`);
									rawItems = [];
								}

								fileManagerLogger.debug(`✅ Obtenidas ${rawItems.length} imágenes para carpeta ${id}`);

								// Si hay imágenes, registrar la primera para diagnóstico
								if (rawItems.length > 0) {
									const firstItem = rawItems[0];
									fileManagerLogger.debug('📄 Primera imagen:', {
										id: firstItem.id,
										name: firstItem.name,
										path: firstItem.path,
										hasThumbnail: !!firstItem.thumbnail
									});
								} else {
									// Si no hay imágenes, verificar si la carpeta existe y tiene archivos
									const getFolderById = await import('@/app/actions/folders/query.actions').then(
										(mod) => mod.getFolderById
									);
									const folderDetails = await getFolderById(id);

									if (folderDetails && (folderDetails.totalFiles > 0 || folderDetails._count?.images > 0)) {
										fileManagerLogger.warn(`⚠️ La carpeta tiene ${folderDetails.totalFiles || folderDetails._count?.images} archivos pero no se obtuvieron imágenes`);
									}
								}
                                                        } catch (folderError) {
                                                                fileManagerLogger.error(`❌ Error obteniendo imágenes de carpeta ${id}:`, folderError);
                                                                if (rawItems.length === 0) {
                                                                        throw new Error('Error cargando imágenes de carpeta');
                                                                }
                                                        }
						}
						break;
					}
                                        case 'collection': {
                                                if (id) {
                                                        rawItems = await getCollectionImages(id);
                                                }
                                                break;
                                        }
					case 'tag':
						if (id) rawItems = await getTagImages(id);
						break;
					case 'album':
						if (id) rawItems = await getAlbumImages(id);
						break;
					case 'character':
						if (id) rawItems = await getCharacterImages(id);
						break;
					case 'place':
						if (id) rawItems = await getPlaceImages(id);
						break;
					case 'worldItem':
						if (id) rawItems = await getWorldItemImages(id);
						break;
					case 'favorites': {
						// Para favoritos, usar getFavorites action
						const favoritesResponse = await getFavorites();
						rawItems = favoritesResponse.map((f) => ({ ...f.image, isFavorite: true }));
						break;
					}
                                        case 'all': {
                                                const result = await getImages({ pageSize: 1000 });
                                                rawItems = result.images || [];
                                                break;
                                        }
					default:
						throw new Error(`Contexto no soportado: ${context}`);
				}

				// 💾 Guardar en cache solo si hay items
				if (rawItems.length > 0) {
					folderCache.set(cacheKey, rawItems);
				}

				// 🔄 Transformar items
				const transformedItems = rawItems.map(transformToFileItem);

				set({
					currentItems: transformedItems,
					displayedItems: transformedItems.slice(0, ITEMS_PER_BATCH),
					isProcessingThumbnails: transformedItems.length > 0,
					lastUpdate: Date.now(),
				});

				// Actualizar el contador de la carpeta actual si es necesario
				if (context === 'folder' && id && state.currentFolder) {
					const updatedFolder = {
						...state.currentFolder,
						count: transformedItems.length,
					};
					set({ currentFolder: updatedFolder });
				}

				fileManagerLogger.info(`✅ ${transformedItems.length} items cargados para ${context}`);
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
		const currentLength = state.displayedItems.length;
		const totalItems = state.currentItems.length;

		if (currentLength >= totalItems) {
			fileManagerLogger.debug('📂 No hay más items para cargar');
			return;
		}

		const nextBatch = state.currentItems.slice(currentLength, currentLength + ITEMS_PER_BATCH);

		fileManagerLogger.info(`🔄 Cargando ${nextBatch.length} items adicionales`);

		set({
			displayedItems: [...state.displayedItems, ...nextBatch],
			lastUpdate: Date.now(),
		});
	},

	// 🎯 Selección optimizada de items
	selectItem: (item: FileItem) => {
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

	toggleItemSelection: (item: FileItem, isMultiSelect: boolean) => {
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
			lastSelectedItem: state.displayedItems[state.displayedItems.length - 1] || null,
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
		if (!folder || !folder.count) {
			try {
				// Intentar obtener información detallada de la carpeta
				const getFolderById = await import('@/app/actions/folders/query.actions').then(
					(mod) => mod.getFolderById
				);
				const folderDetails = await getFolderById(id);
				if (folderDetails) {
					folderWithDetails = {
						id: folderDetails.id,
						name: folderDetails.name,
						// Asegurar que count tenga un valor correcto
						count: folderDetails.totalFiles || folderDetails._count?.images || 0,
					};
					fileManagerLogger.debug('📊 Detalles de carpeta obtenidos:', {
						id: folderWithDetails.id,
						name: folderWithDetails.name,
						count: folderWithDetails.count
					});
				}
			} catch (error) {
				fileManagerLogger.warn('⚠️ Error obteniendo detalles de carpeta:', error);
			}
		}

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
			currentContext: 'worldItem',
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
		await state.loadItems('worldItem', id);
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
		if (!state.currentContext) return;

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
}));

// 🔄 Hooks especializados para diferentes contextos
export const useFolder = () => {
	const store = useUnifiedFileManager();
	return {
		currentFolder: store.currentFolder,
		setCurrentFolder: store.setCurrentFolder,
		folderImages: store.currentContext === 'folder' ? store.currentItems : [],
		isLoading: store.isLoading && store.currentContext === 'folder',
	};
};

export const useCollection = () => {
	const store = useUnifiedFileManager();
	return {
		currentCollection: store.currentCollection,
		setCurrentCollection: store.setCurrentCollection,
		collectionImages: store.currentContext === 'collection' ? store.currentItems : [],
		isLoading: store.isLoading && store.currentContext === 'collection',
	};
};

export const useSelection = () => {
	const store = useUnifiedFileManager();
	return {
		selectedItems: store.selectedItems,
		selectedItem: store.selectedItem,
		lastSelectedItem: store.lastSelectedItem,
		selectItem: store.selectItem,
		deselectItem: store.deselectItem,
		toggleItemSelection: store.toggleItemSelection,
		clearSelection: store.clearSelection,
		selectAll: store.selectAll,
		selectRange: store.selectRange,
	};
};

export const useNavigation = () => {
	const store = useUnifiedFileManager();
	return {
		currentContext: store.currentContext,
		setCurrentFolder: store.setCurrentFolder,
		setCurrentCollection: store.setCurrentCollection,
		setCurrentTag: store.setCurrentTag,
		setCurrentAlbum: store.setCurrentAlbum,
		setCurrentCharacter: store.setCurrentCharacter,
		setCurrentPlace: store.setCurrentPlace,
		setCurrentWorldItem: store.setCurrentWorldItem,
		loadAllImages: store.loadAllImages,
		refreshCurrentContext: store.refreshCurrentContext,
	};
};

// 🎯 Hook principal - reexport para compatibilidad
export const useFileManager = useUnifiedFileManager;

fileManagerLogger.info('🚀 Unified File Manager Store configurado correctamente');
